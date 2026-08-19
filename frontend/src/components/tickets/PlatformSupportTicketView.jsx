import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  LifeBuoy,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  User,
  Calendar,
  Layers,
  FileText,
  Tag,
  PlayCircle,
  HelpCircle,
  Settings2,
  Lock,
  MessageSquare
} from 'lucide-react';
import ticketApi from '../../api/ticket.api.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { useTicketSocket } from '../../hooks/useTicketSocket.js';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Avatar from '../ui/Avatar.jsx';
import Breadcrumbs from '../ui/Breadcrumbs.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import Modal from '../ui/Modal.jsx';
import { formatDate, formatRelative } from '../../utils/formatters.js';
import { toast } from 'sonner';

export const PlatformSupportTicketView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const isOrgAdmin = user?.role === 'org_admin';

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const messagesEndRef = useRef(null);

  // 1. Real-time Socket Listener
  useTicketSocket(id);

  // 2. Fetch Platform Support Ticket Details
  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => (ticketApi.getTicketById ? ticketApi.getTicketById(id) : ticketApi.getTicket(id)),
    enabled: Boolean(id)
  });

  // 3. Fetch Discussion Messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => ticketApi.getMessages(id),
    enabled: Boolean(id)
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Mutations
  const sendMutation = useMutation({
    mutationFn: (msgText) => ticketApi.sendMessage(id, msgText),
    onSuccess: (savedMsg) => {
      setMessageInput('');
      queryClient.setQueryData(['messages', id], (old = []) => {
        if (!savedMsg) return old;
        const msgItem = savedMsg.data || savedMsg;
        if (old.some((m) => String(m._id) === String(msgItem._id))) return old;
        return [...old, msgItem];
      });
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to send message');
    },
    onSettled: () => setIsSending(false)
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, priority, resolutionNotes }) =>
      ticketApi.updateTicketStatus(id, { status, priority, resolutionNotes }),
    onSuccess: (res) => {
      const updated = res?.data || res || {};
      const statusLabel =
        updated.status === 'in_progress'
          ? 'Case marked as In Progress'
          : updated.status === 'resolved'
          ? 'Case marked as Resolved'
          : 'Support case updated';
      toast.success(statusLabel);
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['platform-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update case')
  });

  const resolveMutation = useMutation({
    mutationFn: (notes) => ticketApi.resolveTicket(id, { resolutionNotes: notes }),
    onSuccess: () => {
      toast.success('Platform support case resolved');
      setResolveModalOpen(false);
      setResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['platform-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to resolve case')
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending) return;
    setIsSending(true);
    sendMutation.mutate(messageInput.trim());
  };

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error('Please enter resolution summary');
      return;
    }
    resolveMutation.mutate(resolutionNotes.trim());
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
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
          Support Case Not Found
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested platform support request does not exist or you do not have permission to view it.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate(isSuperAdmin ? '/admin/support' : '/platform-support')}
        >
          Return to Platform Support
        </Button>
      </div>
    );
  }

  const caseCode = `SUP-${ticket._id?.substring(0, 6).toUpperCase()}`;
  const orgName = ticket.organizationId?.name || ticket.organizationName || 'Tenant Organization';
  const requesterEmail = ticket.raisedBy?.email || 'Org Administrator';
  const requesterName = ticket.raisedBy?.name || requesterEmail.split('@')[0];
  const isResolved = ticket.status === 'resolved';

  const categoryLabels = {
    billing: 'Billing & Subscriptions',
    plan_upgrade: 'Plan & Quotas',
    policy: 'Configuration & Access',
    technical: 'Technical Issues',
    other: 'General / Other'
  };

  const priorityLabels = {
    p1: { label: 'P1 — Critical', bg: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
    p2: { label: 'P2 — High', bg: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    p3: { label: 'P3 — Medium', bg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    p4: { label: 'P4 — Low', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' }
  };
  const currentPriority = priorityLabels[ticket.priority?.toLowerCase()] || priorityLabels.p3;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Breadcrumbs
          items={[
            ...(isSuperAdmin
              ? [
                  { label: 'Platform Support', to: '/admin/support' },
                  { label: caseCode }
                ]
              : [
                  { label: 'Platform Support', to: '/platform-support' },
                  { label: caseCode }
                ])
          ]}
        />

        <Button
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate(isSuperAdmin ? '/admin/support' : '/platform-support')}
          className="text-xs self-start sm:self-auto"
        >
          Back to Support Queue
        </Button>
      </div>

      {/* 2. Platform Support Case Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md border border-purple-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-xs font-extrabold border border-purple-400/30">
                PLATFORM SUPPORT • {caseCode}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${currentPriority.bg}`}>
                {currentPriority.label}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                  ticket.status === 'resolved'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : ticket.status === 'in_progress'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                {ticket.status === 'resolved'
                  ? 'Resolved'
                  : ticket.status === 'in_progress'
                  ? 'In Progress — Being Worked On'
                  : 'Open — Awaiting Attention'}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              {ticket.title}
            </h1>

            <p className="text-xs text-purple-200/80 flex items-center gap-2 flex-wrap">
              <span>Organization: <strong className="text-white">{orgName}</strong></span>
              <span>•</span>
              <span>Requested by: <strong className="text-white">{requesterName}</strong> ({requesterEmail})</span>
              <span>•</span>
              <span>Created: {formatDate(ticket.createdAt)} ({formatRelative(ticket.createdAt)})</span>
            </p>
          </div>

          {/* Quick Action in Header (SuperAdmin Only) */}
          {isSuperAdmin && !isResolved && (
            <div className="flex items-center gap-3">
              {ticket.status === 'open' ? (
                <Button
                  variant="primary"
                  icon={PlayCircle}
                  loading={updateStatusMutation.isPending}
                  onClick={() => updateStatusMutation.mutate({ status: 'in_progress' })}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 border-indigo-500 shadow-md"
                >
                  Mark In Progress
                </Button>
              ) : (
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={() => setResolveModalOpen(true)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-500 shadow-md"
                >
                  Resolve Case
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Case Statement & Discussion */}
        <div className="lg:col-span-8 space-y-6">
          {/* Initial Statement */}
          <Card className="p-5 border-l-4 border-l-purple-600 space-y-3" hoverLift={false}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar name={requesterName} size="sm" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {requesterName} <span className="text-[10px] font-normal text-slate-400 font-mono">({requesterEmail})</span>
                  </h4>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                    Organization Administrator • Case Initiator
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                {formatDate(ticket.createdAt)}
              </span>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-8">
              {ticket.description}
            </div>
          </Card>

          {/* Discussion Stream */}
          <Card className="p-0 overflow-hidden" hoverLift={false}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Case Discussion History ({messages.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Audited Platform Communication
              </span>
            </div>

            <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No responses recorded yet. Use the discussion composer below to communicate.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMsgSuperAdmin = msg.senderRole === 'super_admin';
                  const isSystem = msg.isSystemMessage || msg.senderRole === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg._id} className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          ⚙️ {msg.message}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          ({formatRelative(msg.createdAt)})
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${
                        isMsgSuperAdmin ? 'items-end' : 'items-start'
                      } space-y-1`}
                    >
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          {isMsgSuperAdmin ? 'AssetOwl Platform Administration (SuperAdmin)' : msg.senderName || requesterName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatRelative(msg.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl max-w-[88%] text-xs leading-relaxed shadow-xs whitespace-pre-wrap ${
                          isMsgSuperAdmin
                            ? 'bg-purple-600 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {isResolved ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500 font-medium">
                  This platform support case has been resolved and is closed.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={
                      isSuperAdmin
                        ? 'Type a formal response to the Organization Administrator...'
                        : 'Reply to AssetOwl Platform Administration...'
                    }
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={Send}
                    loading={isSending}
                    disabled={!messageInput.trim()}
                    className="px-4 text-xs"
                  >
                    Send
                  </Button>
                </form>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (4 cols): Case Status & Case Information */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Case Status Card */}
          <Card className="p-5 space-y-4" hoverLift={false}>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-purple-600" /> Case Status
            </h3>

            {/* Current Status Display */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Workflow Status
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {ticket.status === 'resolved'
                    ? 'Resolved'
                    : ticket.status === 'in_progress'
                    ? 'In Progress — Being Worked On'
                    : 'Open — Awaiting Attention'}
                </span>
              </div>
              <Badge
                variant={
                  ticket.status === 'resolved'
                    ? 'resolved'
                    : ticket.status === 'in_progress'
                    ? 'indigo'
                    : 'warning'
                }
                dot
              >
                {ticket.status === 'resolved'
                  ? 'Resolved'
                  : ticket.status === 'in_progress'
                  ? 'In Progress'
                  : 'Open'}
              </Badge>
            </div>

            {/* Status Action Buttons for SuperAdmin */}
            {isSuperAdmin && !isResolved && (
              <div className="pt-1 space-y-2">
                {ticket.status === 'open' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={PlayCircle}
                    loading={updateStatusMutation.isPending}
                    onClick={() => updateStatusMutation.mutate({ status: 'in_progress' })}
                    className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 border-indigo-500"
                  >
                    Mark In Progress
                  </Button>
                )}

                {ticket.status === 'in_progress' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => setResolveModalOpen(true)}
                    className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-500"
                  >
                    Resolve Case
                  </Button>
                )}
              </div>
            )}

            {/* Priority Selector / Display */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Priority / Urgency
              </label>
              {isSuperAdmin && !isResolved ? (
                <select
                  value={ticket.priority || 'p3'}
                  onChange={(e) => updateStatusMutation.mutate({ priority: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="p1">P1 — Critical (Urgent blocker)</option>
                  <option value="p2">P2 — High (Time-sensitive)</option>
                  <option value="p3">P3 — Medium (Standard SLA)</option>
                  <option value="p4">P4 — Low (Non-urgent)</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${currentPriority.bg}`}>
                    {currentPriority.label}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* 2. Case Information Card */}
          <Card className="p-5 space-y-3" hoverLift={false}>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-purple-600" /> Case Information
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Organization</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {orgName}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Requester</span>
                <div className="text-right">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {requesterName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {requesterEmail}
                  </span>
                </div>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {categoryLabels[ticket.issueType] || ticket.issueType}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Created</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Last Updated</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {formatDate(ticket.updatedAt || ticket.createdAt)}
                </span>
              </div>
            </div>
          </Card>

          {/* 3. Resolution Summary Card (Only shown when resolved) */}
          {isResolved && (
            <Card className="p-5 space-y-3 border-l-4 border-l-emerald-600" hoverLift={false}>
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resolution Summary
              </h3>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-100 leading-relaxed whitespace-pre-wrap">
                {ticket.resolutionNotes || 'Case resolved by AssetOwl Platform Administration.'}
              </div>

              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Resolved Date:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {formatDate(ticket.resolvedAt || ticket.updatedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Resolved By:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    AssetOwl Platform Administration
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Resolve Case Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Resolve Platform Support Case"
        subtitle={`Provide a formal resolution summary for ${caseCode}`}
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Resolution Summary / Actions Taken
            </label>
            <textarea
              rows={4}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Detail the steps taken, configuration adjustments, or resolution provided to the Organization Admin..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResolveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              loading={resolveMutation.isPending}
            >
              Confirm Resolution
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlatformSupportTicketView;
