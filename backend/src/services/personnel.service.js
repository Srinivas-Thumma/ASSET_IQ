import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Organization from '../models/Organization.js';
import Department from '../models/Department.js';
import Ticket from '../models/Ticket.js';
import Assignment from '../models/Assignment.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from './audit.service.js';

/**
 * Generate a random 12-character secure password with upper, lower, number, special char
 */
export const generateSecurePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*';

  let pwd = '';
  pwd += upper[crypto.randomInt(0, upper.length)];
  pwd += lower[crypto.randomInt(0, lower.length)];
  pwd += digits[crypto.randomInt(0, digits.length)];
  pwd += symbols[crypto.randomInt(0, symbols.length)];

  const all = upper + lower + digits + symbols;
  for (let i = 0; i < 8; i++) {
    pwd += all[crypto.randomInt(0, all.length)];
  }

  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * List all employee & asset_manager users with populated employeeRef and routing domains
 */
export const getPersonnel = async (organizationId) => {
  const [users, org] = await Promise.all([
    User.find({
      organizationId,
      role: { $in: ['employee', 'asset_manager'] }
    })
      .select('-passwordHash')
      .populate({
        path: 'employeeRef',
        populate: { path: 'departmentId', select: 'name code' }
      })
      .sort({ createdAt: -1 })
      .lean(),
    Organization.findById(organizationId).lean()
  ]);

  const defaultRouting = org?.settings?.defaultTicketRouting || {};

  return users.map((u) => {
    const routingDomains = [];
    const userIdStr = String(u._id);
    if (u.role === 'asset_manager') {
      if (defaultRouting.hardware === userIdStr) routingDomains.push('hardware');
      if (defaultRouting.software === userIdStr) routingDomains.push('software');
      if (defaultRouting.network === userIdStr) routingDomains.push('network');
    }

    return {
      _id: u._id,
      email: u.email,
      role: u.role,
      status: u.status,
      employeeRef: u.employeeRef || null,
      firstName: u.employeeRef?.firstName || '',
      lastName: u.employeeRef?.lastName || '',
      fullName: u.employeeRef ? `${u.employeeRef.firstName} ${u.employeeRef.lastName}`.trim() : u.email.split('@')[0],
      jobTitle: u.employeeRef?.jobTitle || '',
      department: u.employeeRef?.departmentId?.name || 'Unassigned',
      departmentId: u.employeeRef?.departmentId?._id || null,
      routingDomains,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    };
  });
};

/**
 * Get single personnel record by User ID
 */
export const getPersonnelById = async (userId, organizationId) => {
  const [user, org] = await Promise.all([
    User.findOne({ _id: userId, organizationId })
      .select('-passwordHash')
      .populate({
        path: 'employeeRef',
        populate: { path: 'departmentId', select: 'name code' }
      })
      .lean(),
    Organization.findById(organizationId).lean()
  ]);

  if (!user) throw new ApiError(404, 'Personnel user not found');

  const defaultRouting = org?.settings?.defaultTicketRouting || {};
  const routingDomains = [];
  const userIdStr = String(user._id);
  if (user.role === 'asset_manager') {
    if (defaultRouting.hardware === userIdStr) routingDomains.push('hardware');
    if (defaultRouting.software === userIdStr) routingDomains.push('software');
    if (defaultRouting.network === userIdStr) routingDomains.push('network');
  }

  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    employeeRef: user.employeeRef || null,
    firstName: user.employeeRef?.firstName || '',
    lastName: user.employeeRef?.lastName || '',
    fullName: user.employeeRef ? `${user.employeeRef.firstName} ${user.employeeRef.lastName}`.trim() : user.email.split('@')[0],
    jobTitle: user.employeeRef?.jobTitle || '',
    department: user.employeeRef?.departmentId?.name || 'Unassigned',
    departmentId: user.employeeRef?.departmentId?._id || null,
    routingDomains,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Create Personnel (User + Employee record dual creation)
 */
export const createPersonnel = async (data, actorUser) => {
  const {
    firstName,
    lastName,
    email,
    password,
    departmentId,
    jobTitle,
    role,
    routingDomains = []
  } = data;

  const normalizedEmail = email.toLowerCase().trim();

  // Check email uniqueness within the organization
  const existingUser = await User.findOne({
    email: normalizedEmail,
    organizationId: actorUser.organizationId
  });

  if (existingUser) {
    throw new ApiError(409, 'This email is already registered in your organization.');
  }

  // Generate password if blank or not provided
  let rawPassword = password?.trim();
  let wasAutoGenerated = false;
  if (!rawPassword) {
    rawPassword = generateSecurePassword();
    wasAutoGenerated = true;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  const validDepartmentId =
    departmentId && mongoose.Types.ObjectId.isValid(departmentId)
      ? departmentId
      : null;

  // 1. Create Employee Document
  const employee = await Employee.create({
    organizationId: actorUser.organizationId,
    organizationName: actorUser.organizationName || '',
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    departmentId: validDepartmentId,
    jobTitle: jobTitle.trim(),
    status: 'active'
  });

  // 2. Create User Document
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    role,
    employeeRef: employee._id,
    organizationId: actorUser.organizationId,
    organizationName: actorUser.organizationName || '',
    status: 'active'
  });

  // 3. If Asset Manager, update ticket routing domains
  if (role === 'asset_manager' && Array.isArray(routingDomains) && routingDomains.length > 0) {
    const updateFields = {};
    if (routingDomains.includes('hardware')) updateFields['settings.defaultTicketRouting.hardware'] = String(user._id);
    if (routingDomains.includes('software')) updateFields['settings.defaultTicketRouting.software'] = String(user._id);
    if (routingDomains.includes('network')) updateFields['settings.defaultTicketRouting.network'] = String(user._id);

    await Organization.findByIdAndUpdate(actorUser.organizationId, { $set: updateFields });
  }

  // 4. Audit Log
  await logAudit({
    actorId: actorUser._id,
    actorRole: actorUser.role,
    action: 'user_created',
    targetType: 'user',
    targetId: user._id,
    metadata: {
      role,
      employeeId: employee._id,
      name: `${firstName} ${lastName}`.trim(),
      email: normalizedEmail
    },
    organizationId: actorUser.organizationId
  });

  return {
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
      employeeRef: employee
    },
    autoGeneratedPassword: wasAutoGenerated ? rawPassword : null
  };
};

/**
 * Update Personnel record
 */
export const updatePersonnel = async (userId, data, actorUser) => {
  const {
    firstName,
    lastName,
    departmentId,
    jobTitle,
    status,
    routingDomains
  } = data;

  const user = await User.findOne({
    _id: userId,
    organizationId: actorUser.organizationId
  });

  if (!user) throw new ApiError(404, 'Personnel record not found');
  if (['super_admin', 'org_admin'].includes(user.role)) {
    throw new ApiError(403, 'Administrative personnel cannot be modified here.');
  }

  // Update User status if provided
  if (status && ['active', 'inactive'].includes(status)) {
    user.status = status;
    await user.save();
  }

  // Update Employee Profile
  if (user.employeeRef) {
    const empUpdates = {};
    if (firstName) empUpdates.firstName = firstName.trim();
    if (lastName) empUpdates.lastName = lastName.trim();
    if (departmentId !== undefined) {
      empUpdates.departmentId =
        departmentId && mongoose.Types.ObjectId.isValid(departmentId)
          ? departmentId
          : null;
    }
    if (jobTitle) empUpdates.jobTitle = jobTitle.trim();
    if (status) empUpdates.status = status === 'active' ? 'active' : 'offboarded';

    await Employee.findByIdAndUpdate(user.employeeRef, { $set: empUpdates });
  }

  // Update Ticket Routing Domains for Asset Manager
  if (user.role === 'asset_manager' && Array.isArray(routingDomains)) {
    const org = await Organization.findById(actorUser.organizationId);
    if (org && org.settings) {
      const routing = org.settings.defaultTicketRouting || {};
      const userIdStr = String(user._id);

      ['hardware', 'software', 'network'].forEach((domain) => {
        if (routingDomains.includes(domain)) {
          routing[domain] = userIdStr;
        } else if (routing[domain] === userIdStr) {
          routing[domain] = 'asset_manager';
        }
      });

      org.settings.defaultTicketRouting = routing;
      org.markModified('settings');
      await org.save();
    }
  }

  // Audit Log
  await logAudit({
    actorId: actorUser._id,
    actorRole: actorUser.role,
    action: 'user_updated',
    targetType: 'user',
    targetId: user._id,
    metadata: { changedFields: Object.keys(data) },
    organizationId: actorUser.organizationId
  });

  return await getPersonnelById(userId, actorUser.organizationId);
};

/**
 * Delete Personnel (with dependency checks for open tickets and active custody)
 */
export const deletePersonnel = async (userId, actorUser) => {
  if (String(userId) === String(actorUser._id)) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }

  const user = await User.findOne({
    _id: userId,
    organizationId: actorUser.organizationId
  });

  if (!user) throw new ApiError(404, 'Personnel record not found');
  if (['super_admin', 'org_admin'].includes(user.role)) {
    throw new ApiError(403, 'Administrative personnel cannot be deleted.');
  }

  // 1. If Asset Manager, check for active claimed tickets
  if (user.role === 'asset_manager') {
    const activeTickets = await Ticket.countDocuments({
      handler: user._id,
      organizationId: actorUser.organizationId,
      status: { $in: ['claimed', 'in_progress'] }
    });

    if (activeTickets > 0) {
      throw new ApiError(
        400,
        `Cannot delete: This Asset Manager has ${activeTickets} active ticket(s) claimed. Reassign tickets first.`
      );
    }

    // Clean up routing domain mappings
    const org = await Organization.findById(actorUser.organizationId);
    if (org && org.settings && org.settings.defaultTicketRouting) {
      const routing = org.settings.defaultTicketRouting;
      const userIdStr = String(user._id);
      let modified = false;

      ['hardware', 'software', 'network'].forEach((dom) => {
        if (routing[dom] === userIdStr) {
          routing[dom] = 'asset_manager';
          modified = true;
        }
      });

      if (modified) {
        org.settings.defaultTicketRouting = routing;
        org.markModified('settings');
        await org.save();
      }
    }
  }

  // 2. If Employee, check for unreturned assigned hardware assets
  if (user.employeeRef) {
    const activeAssignments = await Assignment.countDocuments({
      employeeId: user.employeeRef,
      organizationId: actorUser.organizationId,
      returnedAt: null
    });

    if (activeAssignments > 0) {
      throw new ApiError(
        400,
        `Cannot delete: This employee currently has ${activeAssignments} asset(s) in custody. Return or reassign all assets first.`
      );
    }

    // Hard delete Employee
    await Employee.findByIdAndDelete(user.employeeRef);
  }

  // Hard delete User
  await User.findByIdAndDelete(user._id);

  // Audit Log
  await logAudit({
    actorId: actorUser._id,
    actorRole: actorUser.role,
    action: 'user_deleted',
    targetType: 'user',
    targetId: userId,
    metadata: {
      email: user.email,
      role: user.role,
      deletedAt: new Date()
    },
    organizationId: actorUser.organizationId
  });

  return { success: true };
};

export default {
  generateSecurePassword,
  getPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel
};
