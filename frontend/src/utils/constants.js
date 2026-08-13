export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  ASSET_MANAGER: 'asset_manager',
  EMPLOYEE: 'employee'
};

export const ASSET_STATUSES = {
  STOCK: 'stock',
  ASSIGNED: 'assigned',
  REPAIR: 'repair',
  RETIRED: 'retired'
};

export const TICKET_STATUSES = {
  OPEN: 'open',
  CLAIMED: 'claimed',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const TICKET_TYPES = {
  REPAIR: 'repair',
  REQUEST: 'request',
  RETURN: 'return',
  SUPPORT: 'support'
};

export const TICKET_PRIORITIES = {
  P1: 'p1',
  P2: 'p2',
  P3: 'p3',
  P4: 'p4'
};

export const ISSUE_TYPES = {
  HARDWARE: 'hardware',
  SOFTWARE: 'software',
  NETWORK: 'network',
  ACCESSORY: 'accessory',
  OTHER: 'other'
};

export const RETURN_REASONS = {
  OFFBOARDING: 'offboarding',
  UPGRADE: 'upgrade',
  DEFECTIVE: 'defective'
};

export const INSPECTION_RESULTS = {
  PASS: 'pass',
  FAIL_REPAIR: 'fail_repair',
  FAIL_RETIRE: 'fail_retire'
};

export const STATUS_COLORS = {
  stock: 'bg-blue-50 text-blue-700 border-blue-200',
  assigned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  repair: 'bg-amber-50 text-amber-800 border-amber-200',
  retired: 'bg-slate-100 text-slate-700 border-slate-200',

  open: 'bg-blue-50 text-blue-700 border-blue-200',
  claimed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-700 border-slate-200',

  p1: 'bg-rose-100 text-rose-800 border-rose-200',
  p2: 'bg-orange-100 text-orange-800 border-orange-200',
  p3: 'bg-amber-100 text-amber-800 border-amber-200',
  p4: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const ROLE_DEFAULT_ROUTES = {
  [ROLES.SUPER_ADMIN]: '/admin/dashboard',
  [ROLES.ORG_ADMIN]: '/dashboard',
  [ROLES.ASSET_MANAGER]: '/dashboard',
  [ROLES.EMPLOYEE]: '/my-assets'
};

export default {
  ROLES,
  ASSET_STATUSES,
  TICKET_STATUSES,
  TICKET_TYPES,
  TICKET_PRIORITIES,
  ISSUE_TYPES,
  RETURN_REASONS,
  INSPECTION_RESULTS,
  STATUS_COLORS,
  ROLE_DEFAULT_ROUTES
};
