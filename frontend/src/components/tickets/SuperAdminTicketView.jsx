import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  Building2,
  Laptop,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Tag,
  User,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import ticketApi from '../../api/ticket.api.js';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Avatar from '../ui/Avatar.jsx';
import Breadcrumbs from '../ui/Breadcrumbs.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import HealthScoreBadge from '../ui/HealthScoreBadge.jsx';
import { formatDate, formatRelative } from '../../utils/formatters.js';

const formatRoleLabel = (role) => {
  if (!role) return 'Staff';
  const map = {
    super_admin: 'Super Admin',
    org_admin: 'Org Admin',
    asset_manager: 'Asset Manager',
    employee: 'Employee',
    system: 'System'
  };
  return map[role] || role.replace('_', ' ');
};

const getUserDisplayName = (userObj, fallback = 'User') => {
  if (!userObj) return fallback;
  if (userObj.employeeRef && (userObj.employeeRef.firstName || userObj.employeeRef.lastName)) {
    return `${userObj.employeeRef.firstName || ''} ${userObj.employeeRef.lastName || ''}`.trim();
  }
  if (userObj.name) return userObj.name;
  if (userObj.firstName || userObj.lastName) {
    return `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim();
  }
  if (userObj.email) return userObj.email.split('@')[0];
  return fallback;
};

export const SuperAdminTicketView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'public' | 'internal'

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ['superadmin-ticket', id],
    queryFn: () => (ticketApi.getTicketById ? ticketApi.getTicketById(id) : ticketApi.getTicket(id)),
    enabled: Boolean(id)
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 rounded-2xl text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Ticket Not Found
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested service ticket does not exist or could not be loaded.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate('/admin/organizations')}
        >
          Return to Organizations
        </Button>
      </div>
    );
  }

  const orgId = ticket.organizationId?._id || ticket.organizationId;
  const orgName = ticket.organizationId?.name || ticket.organizationName || 'Tenant Organization';
  const ticketCode = ticket.ticketNumber || ticket.ticketCode || (ticket._id ? `TKT-${ticket._id.slice(-6).toUpperCase()}` : 'TKT');

  // Priority color config
  const priorityConfig = {
    p1: { label: 'P1 Critical', bg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
    p2: { label: 'P2 High', bg: 'bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    p3: { label: 'P3 Medium', bg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    p4: { label: 'P4 Low', bg: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' }
  };
  const currentPriority = priorityConfig[ticket.priority?.toLowerCase()] || priorityConfig.p3;

  // Status color config
  const statusBadgeVariant = {
    open: 'emerald',
    claimed: 'blue',
    in_progress: 'amber',
    resolved: 'purple',
    closed: 'default'
  }[ticket.status?.toLowerCase()] || 'default';

  // Filter messages
  const allMessages = ticket.messages || [];
  const filteredMessages = allMessages.filter((m) => {
    if (filterType === 'public') return !m.isInternal;
    if (filterType === 'internal') return m.isInternal;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Breadcrumbs & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Breadcrumbs
          items={[
            { label: 'Platform', to: '/admin/dashboard' },
            { label: 'Organizations', to: '/admin/organizations' },
            ...(orgId ? [{ label: orgName, to: `/admin/organizations/${orgId}` }] : []),
            { label: ticketCode }
          ]}
          className="mb-0"
        />

        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => {
            if (orgId) navigate(`/admin/organizations/${orgId}`);
            else navigate(-1);
          }}
        >
          Back to Organization
        </Button>
      </div>

      {/* 2. SuperAdmin Administrative Inspection Notice */}
      <div className="p-4 bg-purple-50/80 dark:bg-purple-950/40 rounded-2xl border border-purple-200/80 dark:border-purple-800/60 shadow-xs flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-purple-950 dark:text-purple-200">
              Administrative View — Read-Only Mode
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
              Oversight
            </span>
          </div>
          <p className="text-xs text-purple-900/80 dark:text-purple-300/80 mt-0.5 leading-relaxed">
            This ticket belongs to <span className="font-bold">{orgName}</span>. As SuperAdmin, your access is strictly observational for platform telemetry, audit compliance, and SLA governance. Operational mutations, ticket claiming, status transitions, and message composition are disabled.
          </p>
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ticket Metadata, Request Notes, Resolution & Message Log (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Ticket Header & Summary Card */}
          <Card className="p-6 space-y-5" hoverLift={false}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#6D28D9] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-100 dark:border-purple-900/60">
                  {ticketCode}
                </span>
                <Badge variant={statusBadgeVariant} dot>
                  {ticket.status}
                </Badge>
                {ticket.isEscalated && (
                  <Badge variant="destructive">Escalated</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentPriority.bg}`}>
                  {currentPriority.label}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {ticket.issueType || ticket.type || 'Support'}
                </span>
              </div>
            </div>

            {/* Title & Request Body */}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {ticket.title}
              </h1>
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {ticket.description || 'No initial description provided.'}
              </div>
            </div>

            {/* Requester & Handler Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Requester (Tenant Employee)
                </span>
                <div className="flex items-center gap-2.5">
                  <Avatar name={getUserDisplayName(ticket.raisedBy, 'Employee')} size="sm" />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {getUserDisplayName(ticket.raisedBy, 'Employee')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block truncate">
                      {ticket.raisedBy?.email || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Assigned IT Specialist
                </span>
                {ticket.handler ? (
                  <div className="flex items-center gap-2.5">
                    <Avatar name={getUserDisplayName(ticket.handler, 'Asset Manager')} size="sm" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {getUserDisplayName(ticket.handler, 'Asset Manager')}
                      </span>
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block truncate">
                        {ticket.handler?.employeeRef?.jobTitle || formatRoleLabel(ticket.handler?.role || 'asset_manager')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic py-1">
                    Unclaimed in organization triage queue
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Resolution Summary Card (if resolved or closed) */}
          {(ticket.status === 'resolved' || ticket.status === 'closed' || ticket.resolutionNotes) && (
            <Card className="p-5 border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20" hoverLift={false}>
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ticket Resolution Summary</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-6">
                {ticket.resolutionNotes || 'Marked as resolved by IT support handler.'}
              </p>
              {ticket.resolvedAt && (
                <div className="text-[11px] text-slate-400 pl-6 mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resolved on {formatDate(ticket.resolvedAt)} ({formatRelative(ticket.resolvedAt)})</span>
                </div>
              )}
            </Card>
          )}

          {/* Ticket Messages & Discussion Log (Read-Only) */}
          <Card className="p-0 overflow-hidden" hoverLift={false}>
            {/* Header & Tab Selector */}
            <div className="p-4 bg-slate-50/75 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Audit & Discussion Log
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                  {allMessages.length} entries
                </span>
              </div>

              {/* Message Filters */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  All ({allMessages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('public')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterType === 'public'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Public ({allMessages.filter((m) => !m.isInternal).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('internal')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterType === 'internal'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Internal Notes ({allMessages.filter((m) => m.isInternal).length})
                </button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="p-4 sm:p-6 space-y-3 max-h-[480px] overflow-y-auto bg-slate-50/30 dark:bg-slate-950/40">
              {filteredMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                  <MessageSquare className="w-6 h-6 mx-auto opacity-40 mb-1" />
                  <p>No messages matching filter recorded for this ticket.</p>
                </div>
              ) : (
                filteredMessages.map((msg, idx) => {
                  const isSystem = msg.isSystemMessage || msg.senderRole === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg._id || idx} className="flex justify-center my-2">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span>{msg.message}</span>
                          <span className="text-slate-400 text-[10px] ml-1">
                            {formatRelative(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id || idx}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        msg.isInternal
                          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-slate-900 dark:text-amber-100'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {msg.senderName || msg.senderEmail?.split('@')[0] || 'User'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {formatRoleLabel(msg.senderRole)}
                          </span>
                          {msg.isInternal && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded">
                              <Lock className="w-2.5 h-2.5" />
                              Internal Note
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDate(msg.createdAt)} ({formatRelative(msg.createdAt)})
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Read-Only Notice Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>SuperAdmin access is read-only. Operational message composing is disabled.</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Organization Context, Associated Equipment & Timelines (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tenant Organization Context Card */}
          <Card className="p-5 space-y-3.5" hoverLift={false}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tenant Context
              </span>
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {orgName}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Org ID: {orgId ? String(orgId).slice(-8) : '—'}
              </p>
            </div>

            {orgId && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                icon={ExternalLink}
                onClick={() => navigate(`/admin/organizations/${orgId}`)}
              >
                Inspect Organization
              </Button>
            )}
          </Card>

          {/* Associated Equipment / Hardware Card */}
          {ticket.assetId && (
            <Card className="p-5 space-y-3.5" hoverLift={false}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Equipment
                </span>
                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                  {ticket.assetId?.assetCode || 'HW-ASSET'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {ticket.assetId?.name || 'Tracked Hardware'}
                  </h4>
                  <span className="text-[11px] text-slate-400 capitalize block">
                    Status: {ticket.assetId?.status || 'Active'}
                  </span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center text-xs"
                icon={ExternalLink}
                onClick={() => navigate(`/assets/${ticket.assetId?._id || ticket.assetId}`)}
              >
                Inspect Hardware Asset
              </Button>
            </Card>
          )}

          {/* SLA & Timestamp Telemetry Card */}
          <Card className="p-5 space-y-3" hoverLift={false}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-2 border-b border-slate-100 dark:border-slate-800">
              Telemetry & Timestamps
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Created:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Last Modified:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatRelative(ticket.updatedAt)}
                </span>
              </div>

              {ticket.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Resolved At:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatDate(ticket.resolvedAt)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-500">Category Ref:</span>
                <span className="font-medium text-slate-900 dark:text-white capitalize">
                  {ticket.categoryId?.name || ticket.issueType || 'General'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminTicketView;
