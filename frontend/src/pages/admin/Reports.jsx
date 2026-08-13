import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  HardDrive,
  Download,
  Building,
  ShieldCheck,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { dashboardApi } from '../../api/dashboard.api.js';
import { formatCurrency } from '../../utils/formatters.js';
import { useToast } from '../../components/ui/ToastProvider.jsx';

export const Reports = () => {
  const toast = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats()
  });

  const exportReport = (format) => {
    toast.success(`Exporting fleet audit report as .${format.toLowerCase()}... Download starting shortly.`);
  };

  const statusData = [
    { label: 'In Active Custody', count: stats?.assetsByStatus?.assigned || 0, color: 'bg-emerald-500', text: 'text-emerald-600' },
    { label: 'Available Stock', count: stats?.assetsByStatus?.stock || 0, color: 'bg-indigo-500', text: 'text-indigo-600' },
    { label: 'Maintenance / Repair', count: stats?.assetsByStatus?.repair || 0, color: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Decommissioned / Retired', count: stats?.assetsByStatus?.retired || 0, color: 'bg-slate-400', text: 'text-slate-500' }
  ];

  const total = stats?.totalAssets || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Governance', to: '/dashboard' },
          { label: 'Reports & Analytics' }
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
            Reports & Enterprise Analytics
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
            Enterprise hardware utilization, lifecycle audits, and departmental asset allocation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            icon={FileSpreadsheet}
            onClick={() => exportReport('CSV')}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            icon={Download}
            onClick={() => exportReport('PDF')}
          >
            Generate Audit PDF
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-[12px] p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            Total Managed Assets
          </span>
          <div className="text-[28px] font-bold text-[#1E293B] dark:text-white">
            {isLoading ? <Skeleton width={60} height={32} /> : stats?.totalAssets || 0}
          </div>
          <p className="text-xs text-[#94A3B8]">Total tracked devices in organization</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[12px] p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            Fleet Utilization Rate
          </span>
          <div className="text-[28px] font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.totalAssets ? Math.round(((stats?.assetsByStatus?.assigned || 0) / stats.totalAssets) * 100) : 0}%
          </div>
          <p className="text-xs text-[#94A3B8]">Assets deployed to active personnel</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[12px] p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            Top Department Unit
          </span>
          <div className="text-[28px] font-bold text-purple-700 dark:text-purple-300 truncate">
            {stats?.topDepartment?.name || 'Unassigned'}
          </div>
          <p className="text-xs text-[#94A3B8]">{stats?.topDepartment?.count || 0} active assignments</p>
        </div>
      </div>

      {/* Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card title="Fleet Status Breakdown" subtitle="Real-time distribution across lifecycle stages">
          <div className="space-y-4 pt-2">
            {statusData.map((item, index) => {
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#1E293B] dark:text-slate-300">{item.label}</span>
                    <span className={`font-semibold ${item.text}`}>{item.count} devices ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Department Asset Allocation */}
        <Card title="Department Fleet Allocation" subtitle="Equipment assigned per department unit">
          <div className="space-y-3 pt-2">
            {stats?.assetsByDepartment?.length ? (
              stats.assetsByDepartment.map((dept, i) => (
                <div
                  key={i}
                  className="p-3 bg-purple-50/40 dark:bg-slate-800/40 rounded-[8px] border border-purple-100/80 dark:border-purple-900/30 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                      <Building className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[#1E293B] dark:text-white">{dept.name}</span>
                  </div>
                  <span className="font-bold text-sm text-purple-700 dark:text-purple-300">
                    {dept.count} assets
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-xs text-slate-400">No department allocation data available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
