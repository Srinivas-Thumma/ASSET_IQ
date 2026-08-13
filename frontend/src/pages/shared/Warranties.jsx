import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Calendar,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  Building2,
  HardDrive,
  Eye
} from 'lucide-react';
import assetApi from '../../api/asset.api.js';
import KpiCard from '../../components/ui/KpiCard.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { formatDate, formatRelative } from '../../utils/formatters.js';
import { useToast } from '../../components/ui/ToastProvider.jsx';

export const Warranties = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'expiring_soon' | 'expired'
  const [searchQuery, setSearchQuery] = useState('');
  const [renewAsset, setRenewAsset] = useState(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  // Renewal form
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [warrantyType, setWarrantyType] = useState('extended');
  const [warrantyDocUrl, setWarrantyDocUrl] = useState('');

  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ['warranties', activeTab],
    queryFn: () => assetApi.getWarranties({ filter: activeTab })
  });

  const { data: stats } = useQuery({
    queryKey: ['warranty-stats'],
    queryFn: assetApi.getWarrantyStats
  });

  const renewMutation = useMutation({
    mutationFn: ({ id, data }) => assetApi.renewWarranty(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      queryClient.invalidateQueries({ queryKey: ['warranty-stats'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Warranty successfully renewed and active period extended');
      setIsRenewModalOpen(false);
      setRenewAsset(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to renew warranty');
    }
  });

  const handleOpenRenew = (item) => {
    setRenewAsset(item);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setNewExpiryDate(nextYear.toISOString().split('T')[0]);
    setWarrantyType('extended');
    setWarrantyDocUrl('');
    setIsRenewModalOpen(true);
  };

  const handleRenewSubmit = (e) => {
    e.preventDefault();
    if (!newExpiryDate) {
      toast.error('Please specify a new expiration date');
      return;
    }
    renewMutation.mutate({
      id: renewAsset._id,
      data: {
        newWarrantyEndDate: newExpiryDate,
        warrantyType,
        warrantyDocUrl
      }
    });
  };

  const filteredWarranties = useMemo(() => {
    return warranties.filter((w) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        w.name?.toLowerCase().includes(q) ||
        w.assetCode?.toLowerCase().includes(q) ||
        w.categoryName?.toLowerCase().includes(q) ||
        w.vendorName?.toLowerCase().includes(q)
      );
    });
  }, [warranties, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Operations', to: '/dashboard' },
          { label: 'Warranty Coverage Center' }
        ]}
      />

      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Warranty Coverage Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Track enterprise hardware warranty lifecycles, monitor upcoming expiries, and process vendor renewals.
        </p>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Active Warranties"
          value={stats?.active ?? 0}
          delta="Protected"
          deltaLabel="Full OEM / Extended Support"
          isPositive={true}
          icon={ShieldCheck}
        />

        <KpiCard
          title="Expiring Soon (<30 Days)"
          value={stats?.expiringSoon ?? 0}
          delta={stats?.expiringSoon > 0 ? `${stats.expiringSoon} Attention` : 'All Clear'}
          deltaLabel="Renewal Action Needed"
          isPositive={stats?.expiringSoon === 0}
          alertDot={stats?.expiringSoon > 0}
          icon={Clock}
        />

        <KpiCard
          title="Expired / Lapsed Coverage"
          value={stats?.expired ?? 0}
          delta={stats?.expired > 0 ? `${stats.expired} Unprotected` : 'Zero Lapsed'}
          deltaLabel="Out of Warranty"
          isPositive={stats?.expired === 0}
          icon={ShieldAlert}
        />
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-4 space-y-3" hoverLift={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { key: 'all', label: `All Hardware (${stats?.total ?? 0})` },
              { key: 'active', label: `Active (${stats?.active ?? 0})` },
              { key: 'expiring_soon', label: `Expiring Soon (${stats?.expiringSoon ?? 0})` },
              { key: 'expired', label: `Expired (${stats?.expired ?? 0})` }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by asset code, name..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
            />
          </div>
        </div>
      </Card>

      {/* Warranties Table */}
      {isLoading ? (
        <Card className="p-6 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ) : filteredWarranties.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No warranties to display"
          description="All assets in this filter category have valid warranty status or no filters are active."
        />
      ) : (
        <Card className="p-0 overflow-hidden" hoverLift={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Asset Hardware</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Purchase Date</th>
                  <th className="px-4 py-3.5">Warranty Expiration</th>
                  <th className="px-4 py-3.5">Days Remaining</th>
                  <th className="px-4 py-3.5">Lifecycle Progress</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredWarranties.map((item) => {
                  const isExpired = item.status === 'expired';
                  const isExpiringSoon = item.status === 'expiring_soon';

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Asset Name & Code */}
                      <td className="px-5 py-3.5">
                        <div>
                          <span
                            onClick={() => navigate(`/assets/${item._id}`)}
                            className="font-bold text-slate-900 dark:text-white hover:text-[#6D28D9] cursor-pointer transition-colors block"
                          >
                            {item.name}
                          </span>
                          <span className="font-mono text-[10px] text-[#6D28D9] dark:text-purple-400 font-bold">
                            {item.assetCode}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        {item.categoryName}
                      </td>

                      {/* Purchase Date */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        {formatDate(item.purchaseDate)}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {formatDate(item.warrantyEndDate)}
                      </td>

                      {/* Days Remaining Countdown */}
                      <td className="px-4 py-3.5">
                        {isExpired ? (
                          <span className="font-bold text-red-600">
                            Expired {Math.abs(item.daysRemaining)}d ago
                          </span>
                        ) : (
                          <span className={`font-bold ${isExpiringSoon ? 'text-amber-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            {item.daysRemaining} days left
                          </span>
                        )}
                      </td>

                      {/* Visual Timeline Bar */}
                      <td className="px-4 py-3.5 w-40">
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isExpired
                                  ? 'bg-red-500 w-full'
                                  : isExpiringSoon
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: isExpired ? '100%' : `${item.elapsedPercent || 65}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {isExpired ? '100% elapsed' : `${item.elapsedPercent || 65}% elapsed`}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            isExpired
                              ? 'destructive'
                              : isExpiringSoon
                              ? 'warning'
                              : 'success'
                          }
                          dot
                        >
                          {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRenew(item)}
                            className="h-8 text-xs"
                          >
                            Renew Warranty
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => navigate(`/assets/${item._id}`)}
                            className="h-8 text-slate-400 hover:text-[#6D28D9]"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Renew Warranty Modal */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title={`Renew Warranty: ${renewAsset?.name || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRenewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenewSubmit}
              loading={renewMutation.isPending}
            >
              Confirm Renewal
            </Button>
          </>
        }
      >
        <form onSubmit={handleRenewSubmit} className="space-y-4">
          <Input
            label="New Warranty Expiration Date"
            type="date"
            required
            value={newExpiryDate}
            onChange={(e) => setNewExpiryDate(e.target.value)}
          />

          <Select
            label="Warranty Coverage Type"
            value={warrantyType}
            onChange={(e) => setWarrantyType(e.target.value)}
            options={[
              { value: 'extended', label: 'Extended OEM Warranty' },
              { value: 'manufacturer', label: 'Manufacturer Direct Coverage' },
              { value: 'third_party', label: 'Third-Party / Carrier Insurance' }
            ]}
          />

          <Input
            label="Warranty Document / Certificate URL"
            type="url"
            placeholder="https://storage.assetiq.internal/docs/warranty.pdf"
            value={warrantyDocUrl}
            onChange={(e) => setWarrantyDocUrl(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Warranties;
