import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building,
  Users,
  ShieldCheck,
  Check,
  X,
  HardDrive,
  Boxes,
  ArrowRight,
  TrendingUp,
  Laptop
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../../components/ui/Card.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import {
  useDashboardStats,
  usePendingApprovals,
  useApproveProcurement,
  useRejectProcurement,
  useApproveRetirement,
  useRejectRetirement
} from '../../hooks/useDashboard.js';
import { formatRelative } from '../../utils/formatters.js';
import LottieLoader from '../../components/ui/LottieLoader.jsx';

export const Dashboard = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
  const { data: approvals = [], isLoading: isApprovalsLoading } = usePendingApprovals();

  const approveProcurementMutation = useApproveProcurement();
  const rejectProcurementMutation = useRejectProcurement();
  const approveRetirementMutation = useApproveRetirement();
  const rejectRetirementMutation = useRejectRetirement();

  const handleApprove = (item) => {
    if (item.type === 'procurement') {
      approveProcurementMutation.mutate(item._id);
    } else {
      approveRetirementMutation.mutate(item._id);
    }
  };

  const handleReject = (item) => {
    if (item.type === 'procurement') {
      rejectProcurementMutation.mutate(item._id);
    } else {
      rejectRetirementMutation.mutate(item._id);
    }
  };

  const totalAssets = stats?.totalAssets || 0;
  const stockCount = stats?.assetsByStatus?.stock || 0;
  const assignedCount = stats?.assetsByStatus?.assigned || 0;
  const repairCount = stats?.assetsByStatus?.repair || 0;
  const retiredCount = stats?.assetsByStatus?.retired || 0;

  const stockPct = totalAssets > 0 ? Math.round((stockCount / totalAssets) * 100) : 0;
  const assignedPct = totalAssets > 0 ? Math.round((assignedCount / totalAssets) * 100) : 0;
  const repairPct = totalAssets > 0 ? Math.round((repairCount / totalAssets) * 100) : 0;
  const retiredPct = totalAssets > 0 ? Math.round((retiredCount / totalAssets) * 100) : 0;

  const maxDeptCount = Math.max(
    ...(stats?.assetsByDepartment?.map((d) => d.count) || [1]),
    1
  );

  if (isStatsLoading) {
    return (
      <LottieLoader
        src="/Loading 40 _ Paperplane.lottie"
        className="w-44 h-44"
        message="Loading Organization Dashboard..."
        fullPage
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Executive Governance Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Governance control center, multi-tier approval queue, and enterprise fleet telemetry.
        </p>
      </div>

      {/* TOP ROW: 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Pending Procurement"
          value={isStatsLoading ? '...' : stats?.pendingProcurement || 0}
          delta={stats?.pendingProcurement > 0 ? `${stats.pendingProcurement} Requests` : 'Clear'}
          deltaLabel="Approval Queue"
          isPositive={stats?.pendingProcurement === 0}
          alertDot={stats?.pendingProcurement > 0}
          icon={ShoppingCart}
          onClick={() => navigate('/procurement')}
        />

        <KpiCard
          title="Pending Decommission"
          value={isStatsLoading ? '...' : stats?.pendingRetirement || 0}
          delta={stats?.pendingRetirement > 0 ? `${stats.pendingRetirement} Assets` : 'Clear'}
          deltaLabel="Retirement Queue"
          isPositive={stats?.pendingRetirement === 0}
          alertDot={stats?.pendingRetirement > 0}
          icon={Trash2}
          onClick={() => navigate('/retirements')}
        />

        <KpiCard
          title="Overdue SLAs / Incidents"
          value={isStatsLoading ? '...' : stats?.overdueTickets || 0}
          delta={stats?.overdueTickets > 0 ? `${stats.overdueTickets} SLA Risk` : 'On Track'}
          deltaLabel="Breaching Tickets"
          isPositive={stats?.overdueTickets === 0}
          alertDot={stats?.overdueTickets > 0}
          icon={AlertTriangle}
          onClick={() => navigate('/exceptions')}
        />

        <KpiCard
          title="Unassigned In-Stock"
          value={isStatsLoading ? '...' : stats?.unassignedStock || 0}
          delta="Available"
          deltaLabel="Ready to Deploy"
          isPositive={true}
          icon={HardDrive}
          onClick={() => navigate('/assets')}
        />
      </div>

      {/* SECTION 2: PENDING APPROVALS QUEUE */}
      <Card className="p-0 overflow-hidden" hoverLift={false}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Unified Executive Approval Queue</CardTitle>
              <CardDescription>Authorization required for high-impact capital procurement and asset decommissions</CardDescription>
            </div>
          </div>
          <Badge variant="warning">{approvals.length} Pending</Badge>
        </div>

        <div className="p-5">
          {isApprovalsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : approvals.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All Approvals Cleared"
              description="No procurement requests or decommission authorizations pending your review."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {approvals.map((item) => (
                <div
                  key={item._id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition-colors duration-150"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.type === 'procurement' ? 'purple' : 'warning'}>
                        {item.type === 'procurement' ? 'Procurement Request' : 'Decommission Request'}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono-code">
                        {item.code || `ID-${item._id.slice(-4)}`}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.title || item.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Requested by <strong className="text-slate-700 dark:text-slate-300">{item.requesterName || 'Asset Manager'}</strong> • {formatRelative(item.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={X}
                      onClick={() => handleReject(item)}
                      className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      onClick={() => handleApprove(item)}
                      className="text-xs"
                    >
                      Authorize
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* SECTION 3: FLEET INVENTORY STATUS & DEPARTMENT DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fleet Status Breakdown */}
        <Card className="lg:col-span-6" hoverLift>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle>Fleet Lifecycle Allocation</CardTitle>
              <CardDescription>Total {totalAssets} managed hardware assets</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/assets')}
              className="text-xs text-[#6D28D9] dark:text-purple-300"
            >
              View Inventory
            </Button>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Assigned to Staff', count: assignedCount, pct: assignedPct, color: 'purple' },
              { label: 'In Stock / Ready', count: stockCount, pct: stockPct, color: 'emerald' },
              { label: 'In Repair Bench', count: repairCount, pct: repairPct, color: 'amber' },
              { label: 'Retired / Decommissioned', count: retiredCount, pct: retiredPct, color: 'destructive' }
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{s.label}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{s.count} ({s.pct}%)</span>
                </div>
                <ProgressBar value={s.count} max={totalAssets || 1} colorVariant={s.color} />
              </div>
            ))}
          </div>
        </Card>

        {/* Department Asset Distribution */}
        <Card className="lg:col-span-6" hoverLift>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle>Department Asset Allocation</CardTitle>
              <CardDescription>Hardware distribution across business units</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/departments')}
              className="text-xs text-[#6D28D9] dark:text-purple-300"
            >
              Departments
            </Button>
          </div>

          <div className="space-y-3">
            {(stats?.assetsByDepartment || [
              { name: 'Engineering', count: 42 },
              { name: 'Product & Design', count: 18 },
              { name: 'Sales & Ops', count: 24 },
              { name: 'Finance & HR', count: 12 }
            ]).map((dept) => {
              return (
                <div key={dept.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{dept.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{dept.count} Units</span>
                  </div>
                  <ProgressBar value={dept.count} max={maxDeptCount} colorVariant="purple" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
