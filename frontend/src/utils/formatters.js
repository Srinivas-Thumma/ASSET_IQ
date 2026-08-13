import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { STATUS_COLORS } from './constants.js';

export const formatDate = (dateString, formatStr = 'MMM d, yyyy') => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatStr);
  } catch {
    return String(dateString);
  }
};

export const formatRelative = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return String(dateString);
  }
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPriority = (priority) => {
  if (!priority) return '';
  const map = {
    p1: 'P1 Critical',
    p2: 'P2 High',
    p3: 'P3 Medium',
    p4: 'P4 Low'
  };
  return map[priority.toLowerCase()] || priority.toUpperCase();
};

export const getStatusColor = (status) => {
  if (!status) return 'bg-slate-100 text-slate-700 border-slate-200';
  return STATUS_COLORS[status.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200';
};

export const getAssetHealthScore = (asset) => {
  if (!asset) return 95;
  if (typeof asset.ai?.healthScore === 'number') return asset.ai.healthScore;
  if (typeof asset.healthScore === 'number') return asset.healthScore;
  if (typeof asset.aiHealthScore === 'number') return asset.aiHealthScore;
  return 95;
};

