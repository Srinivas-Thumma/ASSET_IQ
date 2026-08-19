import Ticket from '../models/Ticket.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Assignment from '../models/Assignment.js';
import Employee from '../models/Employee.js';
import Category from '../models/Category.js';
import Location from '../models/Location.js';
import Vendor from '../models/Vendor.js';

export const getExceptionQueue = async (organizationId) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [unclaimed, escalated, retirements] = await Promise.all([
    Ticket.find({
      organizationId,
      status: 'open',
      handler: null,
      createdAt: { $lt: twentyFourHoursAgo }
    })
      .populate('raisedBy', 'email')
      .populate('assetId', 'name assetCode')
      .lean(),
    Ticket.find({
      organizationId,
      isEscalated: true,
      status: { $nin: ['resolved', 'closed'] }
    })
      .populate('raisedBy', 'email')
      .populate('handler', 'email')
      .populate('assetId', 'name assetCode')
      .lean(),
    Asset.find({ organizationId, status: 'repair' })
      .populate('categoryId', 'name')
      .populate('locationId', 'name')
      .lean()
  ]);
  return { unclaimed, escalated, retirements };
};

export const getExceptionCounts = async (organizationId) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [escalated, slaBreaches, procurement, retirements] = await Promise.all([
    Ticket.countDocuments({
      organizationId,
      isEscalated: true,
      status: { $nin: ['resolved', 'closed'] }
    }),
    Ticket.countDocuments({
      organizationId,
      status: 'open',
      handler: null,
      createdAt: { $lt: twentyFourHoursAgo }
    }),
    Ticket.countDocuments({
      organizationId,
      type: 'request',
      status: { $in: ['open', 'claimed'] }
    }),
    Asset.countDocuments({
      organizationId,
      status: 'repair'
    })
  ]);

  return {
    escalatedCount: escalated,
    slaBreachCount: slaBreaches,
    totalExceptions: escalated + slaBreaches,
    pendingProcurementCount: procurement,
    pendingRetirementCount: retirements,
    totalPendingApprovals: procurement + retirements
  };
};

export const getPendingApprovals = async (organizationId) => {
  const [procurementTickets, retirementAssets] = await Promise.all([
    Ticket.find({
      organizationId,
      type: 'request',
      status: { $in: ['open', 'claimed'] }
    })
      .populate('raisedBy', 'email')
      .populate('assetId', 'name assetCode purchasePrice')
      .sort({ createdAt: -1 })
      .lean(),
    Asset.find({
      organizationId,
      status: 'repair'
    })
      .populate('categoryId', 'name')
      .populate('locationId', 'name')
      .sort({ updatedAt: -1 })
      .lean()
  ]);

  const items = [
    ...procurementTickets.map((t) => ({
      _id: t._id,
      type: 'procurement',
      title: t.title,
      requester: t.raisedBy?.email || 'Employee Request',
      details: t.assetId?.purchasePrice ? `$${t.assetId.purchasePrice.toLocaleString()}` : 'Budget Allocation',
      createdAt: t.createdAt,
      ticket: t
    })),
    ...retirementAssets.map((a) => ({
      _id: a._id,
      type: 'retirement',
      title: `${a.name} (${a.assetCode})`,
      requester: 'Inspection Team',
      details: a.categoryId?.name ? `Category: ${a.categoryId.name}` : 'Hardware Repair Flag',
      createdAt: a.updatedAt || a.createdAt,
      asset: a
    }))
  ];

  // Sort by newest
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return items;
};

export const getStats = async (organizationId) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalAssets,
    stockAssets,
    assignedAssets,
    repairAssets,
    retiredAssets,
    pendingProcurement,
    escalatedTickets,
    slaBreaches,
    activeEmployees,
    activeManagers,
    departments
  ] = await Promise.all([
    Asset.countDocuments({ organizationId }),
    Asset.countDocuments({ organizationId, status: 'stock' }),
    Asset.countDocuments({ organizationId, status: 'assigned' }),
    Asset.countDocuments({ organizationId, status: 'repair' }),
    Asset.countDocuments({ organizationId, status: 'retired' }),
    Ticket.countDocuments({
      organizationId,
      type: 'request',
      status: { $in: ['open', 'claimed'] }
    }),
    Ticket.countDocuments({
      organizationId,
      isEscalated: true,
      status: { $nin: ['resolved', 'closed'] }
    }),
    Ticket.countDocuments({
      organizationId,
      status: 'open',
      handler: null,
      createdAt: { $lt: twentyFourHoursAgo }
    }),
    User.countDocuments({ organizationId, role: 'employee', status: 'active' }),
    User.countDocuments({ organizationId, role: 'asset_manager', status: 'active' }),
    Department.find({ organizationId }).lean()
  ]);

  // Aggregate assets by department via assignments/employees
  const deptMap = {};
  departments.forEach((d) => {
    deptMap[String(d._id)] = { name: d.name, count: 0 };
  });

  // Count active assignments by department
  const activeAssignments = await Assignment.find({
    organizationId,
    returnedAt: null
  })
    .populate({
      path: 'employeeId',
      select: 'departmentId'
    })
    .lean();

  activeAssignments.forEach((asgn) => {
    const dId = asgn.employeeId?.departmentId ? String(asgn.employeeId.departmentId) : null;
    if (dId && deptMap[dId]) {
      deptMap[dId].count += 1;
    }
  });

  const assetsByDepartment = Object.values(deptMap);
  let topDepartment = { name: 'None', count: 0 };
  if (assetsByDepartment.length > 0) {
    topDepartment = assetsByDepartment.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), assetsByDepartment[0]);
  }

  const overdueCount = escalatedTickets + slaBreaches;

  return {
    // 4 Decision Cards
    pendingProcurement,
    pendingRetirement: repairAssets,
    pendingRetirements: repairAssets,
    escalatedTickets,
    slaBreaches,
    overdueTickets: overdueCount,
    unassignedStock: stockAssets,

    // Fleet Totals
    totalAssets,
    assetsByStatus: {
      stock: stockAssets,
      assigned: assignedAssets,
      repair: repairAssets,
      retired: retiredAssets
    },

    // Personnel counts
    activeEmployeesCount: activeEmployees,
    activeManagersCount: activeManagers,

    // Department Distribution
    assetsByDepartment,
    topDepartment
  };
};

export const getMetrics = getStats;

export default {
  getExceptionQueue,
  getExceptionCounts,
  getPendingApprovals,
  getStats,
  getMetrics
};
