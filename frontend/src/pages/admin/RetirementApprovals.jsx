import React, { useState } from 'react';
import { Trash2, Check, X } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import { useApproveRetirement, useRejectRetirement } from '../../hooks/useDashboard.js';
import { formatDate, formatRelative } from '../../utils/formatters.js';

export const RetirementApprovals = () => {
  const { assets, isLoading } = useAssets({ status: 'repair' });
  const [confirmModalItem, setConfirmModalItem] = useState(null);

  const approveMutation = useApproveRetirement();
  const rejectMutation = useRejectRetirement();

  const handleConfirmApproval = () => {
    if (!confirmModalItem) return;
    approveMutation.mutate(confirmModalItem._id, {
      onSettled: () => setConfirmModalItem(null)
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Approvals', to: '/dashboard' },
          { label: 'Retirement Approvals' }
        ]}
      />

      <div>
        <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
          Retirement & Decommission Approvals
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
          Authorize asset decommissioning, permanent write-off, and disposal for hardware in repair.
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Asset Code</th>
                <th className="px-5 py-3.5">Asset Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Flagged Since</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400">
                    Loading assets flagged for retirement...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-500">
                    <EmptyState
                      icon={Trash2}
                      title="No pending retirements"
                      description="There are no damaged or repair assets awaiting decommission authorization."
                    />
                  </td>
                </tr>
              ) : (
                assets.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {r.assetCode}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {r.name}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {r.categoryId?.name || 'Hardware'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {formatRelative(r.updatedAt || r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="xs"
                          variant="secondary"
                          icon={X}
                          loading={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(r._id)}
                        >
                          Keep in Stock
                        </Button>
                        <Button
                          size="xs"
                          variant="danger"
                          icon={Trash2}
                          onClick={() => setConfirmModalItem(r)}
                        >
                          Decommission
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmModalItem)}
        onClose={() => setConfirmModalItem(null)}
        title="Confirm Asset Decommission"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModalItem(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Check}
              onClick={handleConfirmApproval}
              loading={approveMutation.isPending}
            >
              Confirm Decommission
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Are you sure you want to authorize the retirement and permanent asset write-off for{' '}
          <strong>{confirmModalItem?.name} ({confirmModalItem?.assetCode})</strong>?
          This action will transition the asset status to <strong>Retired</strong>.
        </p>
      </Modal>
    </div>
  );
};

export default RetirementApprovals;
