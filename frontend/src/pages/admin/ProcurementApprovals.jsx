import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Check, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import { ticketApi } from '../../api/ticket.api.js';
import { useApproveProcurement, useRejectProcurement } from '../../hooks/useDashboard.js';
import { formatDate, formatRelative } from '../../utils/formatters.js';

export const ProcurementApprovals = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'all'

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', { type: 'request' }],
    queryFn: () => ticketApi.getTickets({ type: 'request' })
  });

  const approveMutation = useApproveProcurement();
  const rejectMutation = useRejectProcurement();

  const requestTickets = Array.isArray(tickets) ? tickets.filter((t) => t.type === 'request') : [];

  const pendingRequests = requestTickets.filter(
    (t) => ['open', 'claimed'].includes(t.status)
  );

  const approvedRequests = requestTickets.filter(
    (t) => t.status === 'in_progress'
  );

  const displayedRequests = activeTab === 'pending'
    ? pendingRequests
    : activeTab === 'approved'
    ? approvedRequests
    : requestTickets;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
      case 'claimed':
        return <Badge variant="warning">Awaiting Approval</Badge>;
      case 'in_progress':
        return <Badge variant="emerald">Approved / Purchasing</Badge>;
      case 'resolved':
        return <Badge variant="purple">Fulfilled</Badge>;
      case 'closed':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Approvals', to: '/dashboard' },
          { label: 'Procurement Approvals' }
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-1">
            Procurement & Purchase Approvals
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400">
            Review, authorize, and track hardware purchase requests submitted by personnel across the organization.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending ({pendingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Approved ({approvedRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All History ({requestTickets.length})
          </button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Request Title</th>
                <th className="px-5 py-3.5">Requester</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">
                    Loading procurement requests...
                  </td>
                </tr>
              ) : displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-500">
                    <EmptyState
                      icon={activeTab === 'pending' ? CheckCircle2 : ShoppingCart}
                      title={
                        activeTab === 'pending'
                          ? 'All procurement requests authorized'
                          : 'No purchase requests found'
                      }
                      description={
                        activeTab === 'pending'
                          ? 'There are no procurement authorizations pending executive review.'
                          : 'No hardware purchase requests match the current filter.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                displayedRequests.map((r) => {
                  const isPendingReview = ['open', 'claimed'].includes(r.status);

                  return (
                    <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                        <div>{r.title}</div>
                        {r.resolutionNotes && (
                          <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                            {r.resolutionNotes}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs font-mono">
                        {r.raisedBy?.email || r.raisedBy?.name || 'Employee'}
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {r.description || 'No notes provided.'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {formatRelative(r.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isPendingReview ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="xs"
                              variant="danger"
                              icon={X}
                              loading={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate(r._id)}
                            >
                              Decline
                            </Button>
                            <Button
                              size="xs"
                              variant="primary"
                              icon={Check}
                              loading={approveMutation.isPending}
                              onClick={() => approveMutation.mutate(r._id)}
                            >
                              Authorize
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {r.status === 'in_progress' ? 'Authorized' : r.status === 'closed' ? 'Declined' : 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ProcurementApprovals;
