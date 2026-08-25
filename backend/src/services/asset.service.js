import Asset from '../models/Asset.js';
import Assignment from '../models/Assignment.js';
import Ticket from '../models/Ticket.js';
import Warranty from '../models/Warranty.js';
import Category from '../models/Category.js';
import Employee from '../models/Employee.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from './audit.service.js';
import { calculateHeuristicHealth } from './ai.service.js';

export const calculateExpectedRetirement = (purchaseDate, lifespanMonths = 36) => {
  if (!purchaseDate) return null;
  const pDate = new Date(purchaseDate);
  if (isNaN(pDate.getTime())) return null;
  const retDate = new Date(pDate);
  retDate.setMonth(retDate.getMonth() + Number(lifespanMonths));
  return retDate;
};

export const createAsset = async (data, user) => {
  let lifespan = data.expectedLifespanMonths;
  if (!lifespan && data.categoryId) {
    const cat = await Category.findOne({ _id: data.categoryId, organizationId: user.organizationId }).lean();
    if (cat && cat.expectedLifespanMonths) {
      lifespan = cat.expectedLifespanMonths;
    }
  }
  lifespan = Number(lifespan) || 36;

  const expectedRetirementDate = calculateExpectedRetirement(data.purchaseDate, lifespan);

  const ageMonths = data.purchaseDate
    ? Math.max(0, Math.floor((Date.now() - new Date(data.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375)))
    : 0;

  const initialHeuristic = calculateHeuristicHealth({
    ageInMonths: ageMonths,
    expectedLifespan: lifespan,
    repairCount: 0,
    openRepairCount: 0,
    warrantyStatus: 'none',
    status: data.status || 'stock'
  });

  const assetData = {
    ...data,
    expectedLifespanMonths: lifespan,
    expectedRetirementDate: expectedRetirementDate || data.expectedRetirementDate,
    organizationId: user.organizationId,
    organizationName: user.organizationName || '',
    categoryId: data.categoryId && data.categoryId.trim() ? data.categoryId : null,
    vendorId: data.vendorId && data.vendorId.trim() ? data.vendorId : null,
    locationId: data.locationId && data.locationId.trim() ? data.locationId : null,
    status: data.status || 'stock',
    ai: {
      healthScore: initialHeuristic.healthScore,
      failureRiskPercent: initialHeuristic.failureRiskPercent,
      remainingUsefulLifeMonths: initialHeuristic.remainingUsefulLifeMonths,
      predictedNextMaintenanceDate: initialHeuristic.predictedNextMaintenanceDate,
      lastAnalyzedAt: null, // Null indicates pending official LLM analysis
      replacementRecommendation: initialHeuristic.replacementRecommendation,
      insights: initialHeuristic.insights
    },
    healthHistory: [
      { score: initialHeuristic.healthScore, date: new Date() }
    ]
  };

  const asset = await Asset.create(assetData);

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'asset_created',
    targetType: 'asset',
    targetId: asset._id,
    metadata: { name: asset.name },
    organizationId: user.organizationId
  });

  return asset;
};

export const getAssets = async (organizationId, filters = {}) => {
  const { page, limit, search, status, categoryId, locationId, vendorId } = filters;
  const query = organizationId ? { organizationId } : {};

  if (status) query.status = status;
  if (categoryId) query.categoryId = categoryId;
  if (locationId) query.locationId = locationId;
  if (vendorId) query.vendorId = vendorId;
  if (search && typeof search === 'string' && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { assetCode: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  const attachActiveAssignments = async (assetList) => {
    if (!assetList || assetList.length === 0) return assetList;

    const assetIds = assetList.map((a) => a._id);
    const activeAssignments = await Assignment.find({
      assetId: { $in: assetIds },
      returnedAt: null
    })
      .populate('employeeId', 'firstName lastName email')
      .lean();

    const assignmentMap = new Map();
    for (const assign of activeAssignments) {
      const emp = assign.employeeId;
      let empName = null;
      if (emp) {
        if (typeof emp === 'object') {
          const fn = emp.firstName || '';
          const ln = emp.lastName || '';
          empName = `${fn} ${ln}`.trim() || emp.email;
        } else if (typeof emp === 'string') {
          empName = emp;
        }
      }
      assignmentMap.set(String(assign.assetId), {
        ...assign,
        employeeName: empName || 'Assigned Employee'
      });
    }

    return assetList.map((asset) => {
      const currentAssignment = assignmentMap.get(String(asset._id)) || null;
      return {
        ...asset,
        currentAssignment
      };
    });
  };

  if (page !== undefined || limit !== undefined) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [rawItems, total] = await Promise.all([
      Asset.find(query)
        .populate('categoryId', 'name expectedLifespanMonths')
        .populate('vendorId', 'name')
        .populate('locationId', 'name path type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Asset.countDocuments(query)
    ]);

    const items = await attachActiveAssignments(rawItems);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  const rawAssets = await Asset.find(query)
    .populate('categoryId', 'name expectedLifespanMonths')
    .populate('vendorId', 'name')
    .populate('locationId', 'name path type')
    .sort({ createdAt: -1 })
    .lean();

  return await attachActiveAssignments(rawAssets);
};

export const getAssetById = async (id, organizationId) => {
  const query = organizationId ? { _id: id, organizationId } : { _id: id };
  const asset = await Asset.findOne(query)
    .populate('categoryId', 'name expectedLifespanMonths')
    .populate('vendorId', 'name')
    .populate('locationId', 'name path type parentId')
    .lean();

  if (!asset) throw new ApiError(404, 'Asset not found');

  const [assignments, tickets, warranty] = await Promise.all([
    Assignment.find({ assetId: id, organizationId: asset.organizationId })
      .populate('employeeId', 'firstName lastName email')
      .populate('assignedBy', 'email')
      .populate('inspectedBy', 'email')
      .sort({ assignedAt: -1 })
      .lean(),
    Ticket.find({ assetId: id, organizationId: asset.organizationId })
      .populate('raisedBy', 'email')
      .populate('handler', 'email')
      .sort({ createdAt: -1 })
      .lean(),
    Warranty.findOne({ assetId: id, organizationId: asset.organizationId }).lean()
  ]);

  return {
    ...asset,
    assignments,
    tickets,
    warranty: warranty || {
      expiryDate: asset.warrantyEndDate,
      type: asset.warrantyType || 'manufacturer',
      docUrl: asset.warrantyDocUrl
    }
  };
};

export const getAssetHistory = async (assetId, organizationId) => {
  const query = organizationId ? { _id: assetId, organizationId } : { _id: assetId };
  const asset = await Asset.findOne(query);
  if (!asset) throw new ApiError(404, 'Asset not found');

  const history = await Assignment.find({ assetId, organizationId: asset.organizationId })
    .populate('employeeId', 'firstName lastName email')
    .populate('assignedBy', 'email')
    .populate('inspectedBy', 'email')
    .sort({ assignedAt: -1 })
    .lean();

  return history.map((h) => ({
    _id: h._id,
    assetId: h.assetId,
    employee: h.employeeId
      ? `${h.employeeId.firstName} ${h.employeeId.lastName}`
      : 'Unassigned',
    employeeEmail: h.employeeId?.email,
    assignedBy: h.assignedBy?.email || 'System / Manager',
    assignedAt: h.assignedAt,
    returnedAt: h.returnedAt,
    returnReason: h.returnReason,
    inspectionResult: h.inspectionResult,
    inspectionNotes: h.inspectionNotes,
    inspectedBy: h.inspectedBy?.email
  }));
};

export const getAssetQrCode = async (assetId, organizationId) => {
  const query = organizationId ? { _id: assetId, organizationId } : { _id: assetId };
  const asset = await Asset.findOne(query);
  if (!asset) throw new ApiError(404, 'Asset not found');

  return {
    assetId: asset._id,
    code: asset.assetCode,
    name: asset.name,
    organizationId: asset.organizationId,
    url: `https://assetiq.com/assets/${asset._id}`
  };
};

export const updateAssetStatus = async (assetId, status, reason, user) => {
  const query = user.role === 'super_admin' ? { _id: assetId } : { _id: assetId, organizationId: user.organizationId };
  const asset = await Asset.findOne(query);
  if (!asset) throw new ApiError(404, 'Asset not found');

  const oldStatus = asset.status;
  asset.status = status;
  await asset.save();

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'asset_state_change',
    targetType: 'asset',
    targetId: asset._id,
    metadata: { from: oldStatus, to: status, reason },
    organizationId: asset.organizationId
  });

  return asset;
};

export const requestRetirement = async (assetId, reason, user) => {
  const query = user.role === 'super_admin' ? { _id: assetId } : { _id: assetId, organizationId: user.organizationId };
  const asset = await Asset.findOne(query);
  if (!asset) throw new ApiError(404, 'Asset not found');

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'retirement_requested',
    targetType: 'asset',
    targetId: asset._id,
    metadata: { reason },
    organizationId: asset.organizationId
  });

  return asset;
};

export const approveRetirement = async (assetId, user) => {
  const query = user.role === 'super_admin' ? { _id: assetId } : { _id: assetId, organizationId: user.organizationId };
  const asset = await Asset.findOne(query);
  if (!asset) throw new ApiError(404, 'Asset not found');
  if (asset.status === 'retired') throw new ApiError(400, 'Asset is already retired');

  const oldStatus = asset.status;
  asset.status = 'retired';
  await asset.save();

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'retirement_approved',
    targetType: 'asset',
    targetId: asset._id,
    metadata: { from: oldStatus, to: 'retired' },
    organizationId: asset.organizationId
  });

  return asset;
};

export const getMyAssets = async (employeeId, organizationId) => {
  if (!employeeId) return [];

  const assignments = await Assignment.find({
    employeeId,
    organizationId,
    returnedAt: null
  }).populate({
    path: 'assetId',
    populate: [
      { path: 'categoryId', select: 'name' },
      { path: 'vendorId', select: 'name' },
      { path: 'locationId', select: 'name' }
    ]
  });

  return assignments.map((a) => a.assetId).filter(Boolean);
};

export const updateAsset = async (assetId, updateData, user) => {
  const query = user.role === 'super_admin' ? { _id: assetId } : { _id: assetId, organizationId: user.organizationId };
  const asset = await Asset.findOne(query);
  if (!asset) throw new ApiError(404, 'Asset not found');

  const allowedFields = [
    'name', 'assetCode', 'categoryId', 'vendorId', 'locationId',
    'status', 'purchaseDate', 'purchasePrice', 'warrantyEndDate',
    'warrantyType', 'warrantyDocUrl', 'expectedLifespanMonths',
    'expectedRetirementDate', 'imageUrl', 'currentAssignment'
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      asset[field] = updateData[field];
    }
  });

  if (updateData.purchaseDate || updateData.expectedLifespanMonths) {
    asset.expectedRetirementDate = calculateExpectedRetirement(
      asset.purchaseDate,
      asset.expectedLifespanMonths
    );
  }

  await asset.save();

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'asset_updated',
    targetType: 'asset',
    targetId: asset._id,
    metadata: { updatedFields: Object.keys(updateData) },
    organizationId: asset.organizationId
  });

  return asset;
};

// ────────── WARRANTY HUB SERVICES ──────────

export const getWarranties = async (organizationId, { filter = 'all' } = {}) => {
  const query = organizationId ? { organizationId } : {};
  const assets = await Asset.find(query)
    .populate('categoryId', 'name expectedLifespanMonths')
    .populate('vendorId', 'name')
    .sort({ warrantyEndDate: 1 })
    .lean();

  const nowMs = Date.now();

  const enriched = assets.map((a) => {
    let warrantyEndDate = a.warrantyEndDate;
    if (!warrantyEndDate && a.purchaseDate) {
      // Default to 1 year warranty if not set
      const d = new Date(a.purchaseDate);
      d.setFullYear(d.getFullYear() + 1);
      warrantyEndDate = d;
    }

    const expiryMs = warrantyEndDate ? new Date(warrantyEndDate).getTime() : nowMs + 1000 * 60 * 60 * 24 * 365;
    const diffDays = Math.ceil((expiryMs - nowMs) / (1000 * 60 * 60 * 24));

    let status = 'active';
    if (diffDays <= 0) status = 'expired';
    else if (diffDays <= 30) status = 'expiring_soon';

    // Calculate elapsed percent for timeline bar (assuming 365 or 730 total days)
    const totalDays = 365;
    const elapsedPercent = Math.min(100, Math.max(0, Math.round(((totalDays - Math.max(0, diffDays)) / totalDays) * 100)));

    return {
      _id: a._id,
      name: a.name,
      assetCode: a.assetCode,
      categoryName: a.categoryId?.name || 'Hardware',
      vendorName: a.vendorId?.name || 'Direct OEM',
      purchaseDate: a.purchaseDate,
      warrantyEndDate: warrantyEndDate,
      warrantyType: a.warrantyType || 'manufacturer',
      daysRemaining: diffDays,
      status, // 'active' | 'expiring_soon' | 'expired'
      elapsedPercent,
      healthScore: a.ai?.healthScore || 95
    };
  });

  if (filter === 'active') return enriched.filter((w) => w.status === 'active');
  if (filter === 'expiring_soon') return enriched.filter((w) => w.status === 'expiring_soon');
  if (filter === 'expired') return enriched.filter((w) => w.status === 'expired');

  return enriched;
};

export const getWarrantyStats = async (organizationId) => {
  const warranties = await getWarranties(organizationId, { filter: 'all' });
  const total = warranties.length;
  const active = warranties.filter((w) => w.status === 'active').length;
  const expiringSoon = warranties.filter((w) => w.status === 'expiring_soon').length;
  const expired = warranties.filter((w) => w.status === 'expired').length;

  return {
    total,
    active,
    expiringSoon,
    expired
  };
};

export const renewWarranty = async (assetId, { newWarrantyEndDate, warrantyType = 'extended', warrantyDocUrl }, user) => {
  const query = user.role === 'super_admin' ? { _id: assetId } : { _id: assetId, organizationId: user.organizationId };
  const asset = await Asset.findOne(query);
  if (!asset) throw new ApiError(404, 'Asset not found');

  asset.warrantyEndDate = new Date(newWarrantyEndDate);
  asset.warrantyType = warrantyType;
  if (warrantyDocUrl) asset.warrantyDocUrl = warrantyDocUrl;
  asset.warrantyAlertsSent = []; // Reset alerts on renewal

  await asset.save();

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'warranty_renewed',
    targetType: 'asset',
    targetId: asset._id,
    metadata: { newWarrantyEndDate, warrantyType },
    organizationId: asset.organizationId
  });

  return asset;
};

export const computeAndStoreHealthScore = async (assetId, organizationId = null) => {
  const query = organizationId ? { _id: assetId, organizationId } : { _id: assetId };
  const asset = await Asset.findOne(query);
  if (!asset) return null;

  const tickets = await Ticket.find({
    assetId,
    organizationId: asset.organizationId
  }).lean();
  const repairTickets = tickets.filter((t) => t.type === 'repair' || t.issueType === 'hardware');
  const openRepairTickets = repairTickets.filter((t) => ['open', 'claimed', 'in_progress'].includes(t.status));

  const lifespan = asset.expectedLifespanMonths || 36;
  const ageMonths = asset.purchaseDate
    ? Math.max(0, Math.floor((Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375)))
    : 0;

  const heuristic = calculateHeuristicHealth({
    ageInMonths: ageMonths,
    expectedLifespan: lifespan,
    repairCount: repairTickets.length,
    openRepairCount: openRepairTickets.length,
    status: asset.status
  });

  asset.ai = asset.ai || {};
  asset.ai.healthScore = heuristic.healthScore;
  asset.ai.failureRiskPercent = heuristic.failureRiskPercent;
  asset.ai.remainingUsefulLifeMonths = heuristic.remainingUsefulLifeMonths;
  asset.ai.replacementRecommendation = heuristic.replacementRecommendation;
  asset.ai.insights = heuristic.insights;
  asset.ai.lastAnalyzedAt = new Date();
  await asset.save();

  return heuristic.healthScore;
};

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
  getWarranties,
  getWarrantyStats,
  renewWarranty,
  calculateExpectedRetirement,
  computeAndStoreHealthScore
};
