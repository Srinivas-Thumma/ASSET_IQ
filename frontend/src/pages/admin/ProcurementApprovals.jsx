import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Check, X } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import { ticketApi } from '../../api/ticket.api.js';
import { useApproveProcurement, useRejectProcurement } from '../../hooks/useDashboard.js';
import { formatDate, formatRelative } from '../../utils/formatters.js';

export const ProcurementApprovals = () => {
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', { type: 'request' }],
    queryFn: () => ticketApi.getTickets({ type: 'request' })
  });

  const approveMutation = useApproveProcurement();
  const rejectMutation = useRejectProcurement();

  const pendingRequests = tickets.filter(
    (t) => t.type === 'request' && ['open', 'in_progress', 'claimed'].includes(t.status)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Approvals', to: '/dashboard' },
          { label: 'Procurement Approvals' }
        ]}
      />

      <div>
        <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
          Procurement & Purchase Approvals
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
          Review and authorize hardware purchase requests submitted by personnel across the organization.
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Request Title</th>
                <th className="px-5 py-3.5">Requester</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400">
                    Loading procurement requests...
                  </td>
                </tr>
              ) : pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">
                    <EmptyState
                      icon={ShoppingCart}
                      title="No pending procurement requests"
                      description="All hardware purchase orders have been processed."
                    />
                  </td>
                </tr>
              ) : (
                pendingRequests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {r.title}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs font-mono">
                      {r.raisedBy?.email || 'Employee'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {r.description}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {formatRelative(r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="xs"
                          variant="danger"
                          icon={X}
                          loading={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(r._id)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="xs"
                          variant="primary"
                          icon={Check}
                          loading={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(r._id)}
                        >
                          Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ProcurementApprovals;
