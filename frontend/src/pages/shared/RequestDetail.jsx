import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  ShieldCheck,
  Check,
  X,
  Send,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import LottieLoader from '../../components/ui/LottieLoader.jsx';
import TicketChat from '../../components/tickets/TicketChat.jsx';
import { requestApi } from '../../api/request.api.js';
import { conversationApi } from '../../api/conversation.api.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { formatDate, formatRelative } from '../../utils/formatters.js';
import { toast } from 'sonner';

export const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [decisionNotes, setDecisionNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject' | 'complete'

  const { data: request, isLoading, isError, error } = useQuery({
    queryKey: ['request', id],
    queryFn: () => requestApi.getRequestById(id),
    enabled: Boolean(id)
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['conversation-messages', request?.conversationId],
    queryFn: () => conversationApi.getConversationMessages(request.conversationId),
    enabled: Boolean(request?.conversationId)
  });

  const approveMutation = useMutation({
    mutationFn: (notes) => requestApi.approveRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.success('Administrative request approved');
      setShowNotesInput(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve request')
  });

  const rejectMutation = useMutation({
    mutationFn: (notes) => requestApi.rejectRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.success('Administrative request rejected');
      setShowNotesInput(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject request')
  });

  const completeMutation = useMutation({
    mutationFn: (notes) => requestApi.completeRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast.success('Administrative request marked as completed');
      setShowNotesInput(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to complete request')
  });

  if (isLoading) {
    return (
      <LottieLoader
        src="/Loading 52 _ Mario.lottie"
        className="w-44 h-44"
        message="Loading Administrative Request Case..."
        fullPage
      />
    );
  }

  if (isError || !request) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Administrative Request Not Found
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {error?.response?.data?.message || 'The requested administrative case does not exist or access is restricted.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const categoryLabels = {
    procurement: 'Procurement Request',
    plan_upgrade: 'Plan Upgrade Request',
    quota_increase: 'Quota Increase Request',
    billing: 'Billing & Subscription Query',
    platform_support: 'Platform Support Request',
    other: 'General Administrative Request'
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="warning">Submitted</Badge>;
      case 'under_review':
        return <Badge variant="purple">Under Review</Badge>;
      case 'approved':
        return <Badge variant="emerald">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const canApproveOrReject =
    user?.role === 'super_admin' ||
    (user?.role === 'org_admin' && request.category === 'procurement');

  const handleExecuteAction = () => {
    if (actionType === 'approve') approveMutation.mutate(decisionNotes);
    if (actionType === 'reject') rejectMutation.mutate(decisionNotes);
    if (actionType === 'complete') completeMutation.mutate(decisionNotes);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Requests', to: '/admin/support' },
          { label: request.requestCode || `Request #${request._id.slice(-6)}` }
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono-code font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              {request.requestCode}
            </span>
            {getStatusBadge(request.status)}
            <Badge variant="outline">{categoryLabels[request.category] || request.category}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {request.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {request.organizationName || 'Tenant'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Submitted {formatRelative(request.createdAt)}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        {canApproveOrReject && !['completed', 'rejected'].includes(request.status) && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            {request.status !== 'approved' && (
              <>
                <Button
                  size="sm"
                  variant="danger"
                  icon={X}
                  onClick={() => { setActionType('reject'); setShowNotesInput(true); }}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Check}
                  onClick={() => { setActionType('approve'); setShowNotesInput(true); }}
                >
                  Approve
                </Button>
              </>
            )}
            {request.status === 'approved' && (
              <Button
                size="sm"
                variant="primary"
                icon={CheckCircle2}
                onClick={() => { setActionType('complete'); setShowNotesInput(true); }}
              >
                Mark Completed
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Decision Notes Input Modal / Card */}
      {showNotesInput && (
        <Card className="p-4 bg-purple-50/60 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 space-y-3">
          <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            Provide Decision Notes for {actionType?.toUpperCase()}
          </h4>
          <textarea
            rows={2}
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            placeholder="Add decision rationale or fulfillment instructions..."
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex justify-end gap-2">
            <Button size="xs" variant="outline" onClick={() => setShowNotesInput(false)}>
              Cancel
            </Button>
            <Button
              size="xs"
              variant="primary"
              loading={approveMutation.isPending || rejectMutation.isPending || completeMutation.isPending}
              onClick={handleExecuteAction}
            >
              Confirm {actionType}
            </Button>
          </div>
        </Card>
      )}

      {/* Grid: Request Details (Left) + Unified Realtime Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Overview & Payload */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Request Rationale & Details
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {request.description || 'No description provided.'}
            </p>

            {request.decisionNotes && (
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Decision Rationale:
                </span>
                <p className="text-slate-600 dark:text-slate-400">{request.decisionNotes}</p>
              </div>
            )}
          </Card>

          {/* Category Payload Parameters */}
          {request.payload && Object.keys(request.payload).length > 0 && (
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Structured Request Data
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(request.payload).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">{key}</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Unified Realtime Conversation Room */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Linked Administrative Conversation Room
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                {request.conversationId}
              </span>
            </div>

            <TicketChat
              conversationId={request.conversationId}
              messages={messages}
              onNewMessage={() => refetchMessages()}
              contextType="request"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
