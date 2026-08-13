import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Category from '../models/Category.js';
import Department from '../models/Department.js';
import Location from '../models/Location.js';
import Vendor from '../models/Vendor.js';
import Employee from '../models/Employee.js';

const router = Router();
router.use(authenticate);

const orgFilter = (req) => ({ organizationId: req.user.organizationId });
const managerRoles = ['asset_manager', 'org_admin', 'super_admin'];

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
router.get('/categories', asyncHandler(async (req, res) => {
  const items = await Category.find(orgFilter(req)).sort({ name: 1 });
  res.json(new ApiResponse(200, items, 'Categories retrieved'));
}));

router.post('/categories', requireRole(managerRoles), asyncHandler(async (req, res) => {
  const { name, expectedLifespanMonths } = req.body;
  if (!name) throw new ApiError(400, 'Category name is required');
  const item = await Category.create({
    organizationId: req.user.organizationId,
    organizationName: req.user.organizationName || '',
    name,
    expectedLifespanMonths: Number(expectedLifespanMonths) || 36
  });
  res.status(201).json(new ApiResponse(201, item, 'Category created'));
}));

router.put('/categories/:id', requireRole(managerRoles), asyncHandler(async (req, res) => {
  const item = await Category.findOneAndUpdate(
    { _id: req.params.id, organizationId: req.user.organizationId },
    { $set: req.body },
    { new: true }
  );
  if (!item) throw new ApiError(404, 'Category not found');
  res.json(new ApiResponse(200, item, 'Category updated'));
}));

router.delete('/categories/:id', requireRole(managerRoles), asyncHandler(async (req, res) => {
  await Category.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
  res.json(new ApiResponse(200, null, 'Category deleted'));
}));

// ─── DEPARTMENTS ──────────────────────────────────────────────────────────────
router.get('/departments', asyncHandler(async (req, res) => {
  const items = await Department.find(orgFilter(req)).sort({ name: 1 });
  res.json(new ApiResponse(200, items, 'Departments retrieved'));
}));

router.post('/departments', requireRole(managerRoles), asyncHandler(async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) throw new ApiError(400, 'Department name and code are required');
  const item = await Department.create({
    organizationId: req.user.organizationId,
    organizationName: req.user.organizationName || '',
    name,
    code
  });
  res.status(201).json(new ApiResponse(201, item, 'Department created'));
}));

router.put('/departments/:id', requireRole(managerRoles), asyncHandler(async (req, res) => {
  const item = await Department.findOneAndUpdate(
    { _id: req.params.id, organizationId: req.user.organizationId },
    { $set: req.body },
    { new: true }
  );
  if (!item) throw new ApiError(404, 'Department not found');
  res.json(new ApiResponse(200, item, 'Department updated'));
}));

router.delete('/departments/:id', requireRole(managerRoles), asyncHandler(async (req, res) => {
  await Department.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
  res.json(new ApiResponse(200, null, 'Department deleted'));
}));

import Asset from '../models/Asset.js';

// ─── LOCATIONS ────────────────────────────────────────────────────────────────
router.get('/locations', asyncHandler(async (req, res) => {
  const items = await Location.find(orgFilter(req))
    .populate('parentId', 'name code type level')
    .sort({ level: 1, name: 1 })
    .lean();

  // Attach asset count per location
  const assets = await Asset.find(orgFilter(req)).select('locationId').lean();
  const countMap = {};
  assets.forEach((a) => {
    if (a.locationId) {
      const lid = String(a.locationId);
      countMap[lid] = (countMap[lid] || 0) + 1;
    }
  });

  const enriched = items.map((loc) => ({
    ...loc,
    assetCount: countMap[String(loc._id)] || 0
  }));

  res.json(new ApiResponse(200, enriched, 'Locations retrieved'));
}));

router.get('/locations/tree', asyncHandler(async (req, res) => {
  const items = await Location.find(orgFilter(req))
    .sort({ level: 1, name: 1 })
    .lean();

  const assets = await Asset.find(orgFilter(req)).select('locationId').lean();
  const countMap = {};
  assets.forEach((a) => {
    if (a.locationId) {
      const lid = String(a.locationId);
      countMap[lid] = (countMap[lid] || 0) + 1;
    }
  });

  // Level 1: Building / Branch
  // Level 2: Floor
  // Level 3: Room / Zone
  const locMap = {};
  items.forEach((item) => {
    locMap[String(item._id)] = {
      ...item,
      directAssetCount: countMap[String(item._id)] || 0,
      assetCount: countMap[String(item._id)] || 0,
      children: []
    };
  });

  const rootNodes = [];

  items.forEach((item) => {
    const node = locMap[String(item._id)];
    if (item.parentId && locMap[String(item.parentId)]) {
      locMap[String(item.parentId)].children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  // Rollup asset counts up the hierarchy
  const rollupCounts = (node) => {
    let total = node.directAssetCount || 0;
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        total += rollupCounts(child);
      });
    }
    node.assetCount = total;
    return total;
  };

  rootNodes.forEach(rollupCounts);

  res.json(new ApiResponse(200, rootNodes, 'Location hierarchy tree retrieved'));
}));

router.post('/locations', requireRole(managerRoles), asyncHandler(async (req, res) => {
  const { name, code, type, parentId, address } = req.body;
  if (!name || !code || !type) throw new ApiError(400, 'Location name, code, and type are required');

  let level = 1;
  let computedPath = name;
  let validatedParentId = null;

  if (type === 'floor') {
    level = 2;
    if (!parentId) throw new ApiError(400, 'Floor must have a parent Building or Branch');
    const parent = await Location.findOne({ _id: parentId, organizationId: req.user.organizationId });
    if (!parent || !['building', 'branch'].includes(parent.type)) {
      throw new ApiError(400, 'Parent of a Floor must be a Building or Branch');
    }
    validatedParentId = parent._id;
    computedPath = `${parent.name} → ${name}`;
  } else if (type === 'room' || type === 'zone') {
    level = 3;
    if (!parentId) throw new ApiError(400, 'Room/Zone must have a parent Floor');
    const parent = await Location.findOne({ _id: parentId, organizationId: req.user.organizationId });
    if (!parent || parent.type !== 'floor') {
      throw new ApiError(400, 'Parent of a Room/Zone must be a Floor');
    }
    validatedParentId = parent._id;
    const grandparent = parent.parentId ? await Location.findById(parent.parentId) : null;
    computedPath = grandparent ? `${grandparent.name} → ${parent.name} → ${name}` : `${parent.name} → ${name}`;
  } else {
    // Level 1: building or branch
    level = 1;
    validatedParentId = null;
  }

  const item = await Location.create({
    organizationId: req.user.organizationId,
    organizationName: req.user.organizationName || '',
    name: name.trim(),
    code: code.trim(),
    type,
    level,
    address: level === 1 ? (address || '') : '',
    parentId: validatedParentId,
    path: computedPath
  });

  res.status(201).json(new ApiResponse(201, item, 'Location created successfully'));
}));

router.put('/locations/:id', requireRole(managerRoles), asyncHandler(async (req, res) => {
  const { name, code, type, parentId, address } = req.body;
  const existing = await Location.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!existing) throw new ApiError(404, 'Location not found');

  let level = existing.level || 1;
  let validatedParentId = existing.parentId;
  let computedPath = name || existing.name;

  if (type) {
    if (type === 'floor') {
      level = 2;
      const pId = parentId || existing.parentId;
      if (!pId) throw new ApiError(400, 'Floor must have a parent Building or Branch');
      const parent = await Location.findOne({ _id: pId, organizationId: req.user.organizationId });
      if (!parent || !['building', 'branch'].includes(parent.type)) {
        throw new ApiError(400, 'Parent of a Floor must be a Building or Branch');
      }
      validatedParentId = parent._id;
      computedPath = `${parent.name} → ${name || existing.name}`;
    } else if (type === 'room' || type === 'zone') {
      level = 3;
      const pId = parentId || existing.parentId;
      if (!pId) throw new ApiError(400, 'Room/Zone must have a parent Floor');
      const parent = await Location.findOne({ _id: pId, organizationId: req.user.organizationId });
      if (!parent || parent.type !== 'floor') {
        throw new ApiError(400, 'Parent of a Room/Zone must be a Floor');
      }
      validatedParentId = parent._id;
      const grandparent = parent.parentId ? await Location.findById(parent.parentId) : null;
      computedPath = grandparent ? `${grandparent.name} → ${parent.name} → ${name || existing.name}` : `${parent.name} → ${name || existing.name}`;
    } else {
      level = 1;
      validatedParentId = null;
    }
  }

  const updateFields = {
    ...(name && { name: name.trim() }),
    ...(code && { code: code.trim() }),
    ...(type && { type, level }),
    parentId: validatedParentId,
    path: computedPath,
    address: level === 1 ? (address !== undefined ? address : existing.address) : ''
  };

  const item = await Location.findByIdAndUpdate(
    req.params.id,
    { $set: updateFields },
    { new: true }
  );

  res.json(new ApiResponse(200, item, 'Location updated successfully'));
}));

router.delete('/locations/:id', requireRole(managerRoles), asyncHandler(async (req, res) => {
  // Check if children exist
  const children = await Location.find({ parentId: req.params.id, organizationId: req.user.organizationId });
  if (children.length > 0) {
    throw new ApiError(400, `Cannot delete location: ${children.length} child location(s) exist under this node. Delete or reassign children first.`);
  }

  await Location.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
  res.json(new ApiResponse(200, null, 'Location deleted successfully'));
}));

// ─── VENDORS ──────────────────────────────────────────────────────────────────
router.get('/vendors', asyncHandler(async (req, res) => {
  const items = await Vendor.find(orgFilter(req)).sort({ name: 1 });
  res.json(new ApiResponse(200, items, 'Vendors retrieved'));
}));

router.post('/vendors', requireRole(managerRoles), asyncHandler(async (req, res) => {
  const { name, contactEmail, phone } = req.body;
  if (!name) throw new ApiError(400, 'Vendor name is required');
  const item = await Vendor.create({
    organizationId: req.user.organizationId,
    organizationName: req.user.organizationName || '',
    name,
    contactEmail,
    phone
  });
  res.status(201).json(new ApiResponse(201, item, 'Vendor created'));
}));

router.put('/vendors/:id', requireRole(managerRoles), asyncHandler(async (req, res) => {
  const item = await Vendor.findOneAndUpdate(
    { _id: req.params.id, organizationId: req.user.organizationId },
    { $set: req.body },
    { new: true }
  );
  if (!item) throw new ApiError(404, 'Vendor not found');
  res.json(new ApiResponse(200, item, 'Vendor updated'));
}));

router.delete('/vendors/:id', requireRole(managerRoles), asyncHandler(async (req, res) => {
  await Vendor.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
  res.json(new ApiResponse(200, null, 'Vendor deleted'));
}));

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
router.get('/employees', asyncHandler(async (req, res) => {
  const items = await Employee.find(orgFilter(req))
    .populate('departmentId', 'name')
    .sort({ firstName: 1 });
  res.json(new ApiResponse(200, items, 'Employees retrieved'));
}));

router.post('/employees', requireRole(managerRoles), asyncHandler(async (req, res) => {
  const { firstName, lastName, email, jobTitle, departmentId } = req.body;
  if (!firstName || !lastName || !email) throw new ApiError(400, 'First name, last name, and email are required');
  const item = await Employee.create({
    organizationId: req.user.organizationId,
    organizationName: req.user.organizationName || '',
    firstName,
    lastName,
    email,
    jobTitle,
    departmentId: departmentId || null
  });
  res.status(201).json(new ApiResponse(201, item, 'Employee created'));
}));

router.patch('/employees/:id', requireRole(managerRoles), asyncHandler(async (req, res) => {
  const item = await Employee.findOneAndUpdate(
    { _id: req.params.id, organizationId: req.user.organizationId },
    { $set: req.body },
    { new: true }
  );
  if (!item) throw new ApiError(404, 'Employee not found');
  res.json(new ApiResponse(200, item, 'Employee updated'));
}));

router.delete('/employees/:id', requireRole(managerRoles), asyncHandler(async (req, res) => {
  await Employee.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
  res.json(new ApiResponse(200, null, 'Employee deleted'));
}));

export default router;
