import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, Trash2, CheckCircle, Clock } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { dashboardApi } from '../../api/dashboard.api.js';
import { formatRelative } from '../../utils/formatters.js';
import { toast } from 'sonner';

import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';

export const ExceptionQueue = () => {
  const queryClient = useQueryClient();

  const { data: queue, isLoading } = useQuery({
    queryKey: ['exception-queue'],
    queryFn: () => dashboardApi.getExceptions(),
    refetchInterval: 10000
  });

  const unclaimed = queue?.unclaimed || [];
  const escalated = queue?.escalated || [];
  const retirements = queue?.retirements || [];

  const handleApproveRetirement = async (assetId) => {
    try {
      await dashboardApi.approveRetirement(assetId);
      queryClient.invalidateQueries({ queryKey: ['exception-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['exception-counts'] });
      toast.success('Retirement authorized');
    } catch (err) {
      toast.error('Failed to authorize retirement');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Governance', to: '/dashboard' },
          { label: 'Exception Queue' }
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
          Exception & SLA Breach Queue
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
          High-priority governance alerts, SLA breaches, and critical repairs requiring executive intervention.
        </p>
      </div>

      {/* Section 1: "Unclaimed >24h" (red accent) */}
      <Card
        title="Unclaimed Tickets (>24h SLA Breach)"
        subtitle="Requests that have sat in the open queue past the 24-hour pickup SLA"
        className="border-l-4 border-l-rose-500"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">
                    Loading exception queue...
                  </td>
                </tr>
              ) : unclaimed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">
                    No SLA breach tickets.
                  </td>
                </tr>
              ) : (
                unclaimed.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {t._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {t.title}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {t.raisedBy?.email || 'Employee'}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-400">
                      {formatRelative(t.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="rose" size="sm">Unclaimed SLA</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 2: "Escalated Tickets" (amber accent) */}
      <Card
        title="Escalated Critical Tickets"
        subtitle="Active repairs marked as critical or escalated to senior management"
        className="border-l-4 border-l-amber-500"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Issue Title</th>
                <th className="px-4 py-3">Assigned Handler</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-right">Escalation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">
                    Loading escalated tickets...
                  </td>
                </tr>
              ) : escalated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">
                    No active escalations.
                  </td>
                </tr>
              ) : (
                escalated.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {t._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {t.title}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {t.handler?.email || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="p1" size="sm">{t.priority?.toUpperCase() || 'P1'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-amber-600 font-bold">
                      Escalated
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 3: "Pending Retirements" (slate accent) */}
      <Card
        title="Pending Decommission Approvals"
        subtitle="Assets in repair queued for authorized retirement and disposition"
        className="border-l-4 border-l-slate-500"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Asset Code</th>
                <th className="px-4 py-3">Asset Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">
                    Loading retirements...
                  </td>
                </tr>
              ) : retirements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">
                    No pending retirement signoffs.
                  </td>
                </tr>
              ) : (
                retirements.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {r.assetCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {r.categoryId?.name || 'Hardware'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {r.locationId?.name || 'Main Office'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="xs"
                        variant="danger"
                        onClick={() => handleApproveRetirement(r._id)}
                      >
                        Authorize Retirement
                      </Button>
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

export default ExceptionQueue;
