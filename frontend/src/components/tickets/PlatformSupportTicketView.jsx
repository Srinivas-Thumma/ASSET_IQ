import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  LifeBuoy,
  Shield,
  ShieldCheck,
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
  Sparkles,
  HelpCircle,
  XCircle,
  CreditCard,
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
  const { data: ticket, isLoading, isError, refetch } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => (ticketApi.getTicketById ? ticketApi.getTicketById(id) : ticketApi.getTicket(id)),
    enabled: Boolean(id)
  });

  // 3. Fetch Discussion Messages
  const { data: messages = [], refetch: refetchMessages } = useQuery({
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
    mutationFn: (msgText) => ticketApi.sendMessage(id, { message: msgText }),
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send message');
    },
    onSettled: () => setIsSending(false)
  });

  const claimMutation = useMutation({
    mutationFn: () => ticketApi.claimTicket(id, ticket?.priority || 'p2'),
    onSuccess: () => {
      toast.success('You have taken ownership of this platform support case');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to claim case')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, priority, resolutionNotes }) =>
      ticketApi.updateTicketStatus(id, { status, priority, resolutionNotes }),
    onSuccess: () => {
      toast.success('Support case updated');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update case')
  });

  const resolveMutation = useMutation({
    mutationFn: (notes) => ticketApi.resolveTicket(id, { resolutionNotes: notes }),
    onSuccess: () => {
      toast.success('Platform support case resolved');
      setResolveModalOpen(false);
      setResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', id] });
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
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  const categoryLabels = {
    billing: 'Billing & Subscriptions',
    plan_upgrade: 'Plan & Quota Upgrade',
    policy: 'Policy & Governance',
    technical: 'Platform Technical Issue',
    other: 'General Admin Inquiry'
  };

  const priorityBadges = {
    p1: { label: 'P1 Critical', bg: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
    p2: { label: 'P2 High', bg: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    p3: { label: 'P3 Medium', bg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    p4: { label: 'P4 Low', bg: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' }
  };
  const currentPriority = priorityBadges[ticket.priority?.toLowerCase()] || priorityBadges.p3;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Breadcrumbs
          items={[
            ...(isSuperAdmin
              ? [
                  { label: 'Platform Support Queue', to: '/admin/support' },
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

      {/* 2. Platform Support Case Banner */}
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
              <Badge
                variant={
                  isResolved
                    ? 'resolved'
                    : ticket.status === 'in_progress' || ticket.status === 'claimed'
                    ? 'indigo'
                    : 'warning'
                }
              >
                {ticket.status === 'in_progress' ? 'In Progress' : ticket.status === 'claimed' ? 'Assigned' : ticket.status}
              </Badge>
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

          {/* Quick Resolution indicator */}
          <div className="flex items-center gap-3">
            {isSuperAdmin && !isResolved && (
              <Button
                variant="primary"
                icon={CheckCircle2}
                onClick={() => setResolveModalOpen(true)}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-500 shadow-md"
              >
                Resolve Request
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Formal Case Conversation */}
        <div className="lg:col-span-8 space-y-6">
          {/* Initial Case Statement */}
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
                  Platform Case Discussion History ({messages.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Audited & Timestamped Communication
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
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
                  This platform support case has been resolved and closed.
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

        {/* Right Column (4 cols): Case Overview & Governance Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Support Owner Card */}
          <Card className="p-5 space-y-4" hoverLift={false}>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Support Ownership
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Assigned Platform Owner
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {ticket.handler?.email || (ticket.status === 'open' ? 'Unassigned / Platform Pool' : 'AssetOwl SuperAdmin')}
                </span>
              </div>
              <Badge variant={ticket.handler ? 'emerald' : 'warning'}>
                {ticket.handler ? 'Assigned' : 'Open Pool'}
              </Badge>
            </div>

            {/* Take ownership button for SuperAdmin */}
            {isSuperAdmin && !ticket.handler && !isResolved && (
              <Button
                variant="outline"
                size="sm"
                icon={User}
                loading={claimMutation.isPending}
                onClick={() => claimMutation.mutate()}
                className="w-full text-xs"
              >
                Take Case Ownership
              </Button>
            )}
          </Card>

          {/* Platform Management Actions (SuperAdmin Only) */}
          {isSuperAdmin && !isResolved && (
            <Card className="p-5 space-y-4" hoverLift={false}>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-purple-600" /> Platform Governance
              </h3>

              {/* Change Priority */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Case Priority
                </label>
                <select
                  value={ticket.priority || 'p3'}
                  onChange={(e) => updateStatusMutation.mutate({ priority: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="p1">P1 Critical — Immediate SLA</option>
                  <option value="p2">P2 High — Accelerated SLA</option>
                  <option value="p3">P3 Medium — Standard SLA</option>
                  <option value="p4">P4 Low — General Inquiry</option>
                </select>
              </div>

              {/* Change Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Workflow Status
                </label>
                <select
                  value={ticket.status}
                  onChange={(e) => updateStatusMutation.mutate({ status: e.target.value })}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="open">Open (Awaiting Triage)</option>
                  <option value="claimed">Claimed (Owner Assigned)</option>
                  <option value="in_progress">In Progress (Under Investigation)</option>
                  <option value="resolved">Resolved (Complete)</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </Card>
          )}

          {/* Case Metadata Card */}
          <Card className="p-5 space-y-3" hoverLift={false}>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-purple-600" /> Case Details
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {categoryLabels[ticket.issueType] || ticket.issueType}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Tenant</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {orgName}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Created</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
              {ticket.resolvedAt && (
                <div className="py-2 flex justify-between">
                  <span className="text-slate-400">Resolved Date</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    {formatDate(ticket.resolvedAt)}
                  </span>
                </div>
              )}
            </div>

            {ticket.resolutionNotes && (
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Resolution Summary
                </span>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200">
                  {ticket.resolutionNotes}
                </div>
              </div>
            )}
          </Card>
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
