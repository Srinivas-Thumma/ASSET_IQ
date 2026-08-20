import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Building2,
  HardDrive,
  Users,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Layers,
  Filter,
  CreditCard,
  Ticket,
  Lock,
  XCircle
} from 'lucide-react';
import adminApi from '../../api/admin.api.js';
import KpiCard from '../../components/ui/KpiCard.jsx';
import Card, { CardTitle, CardDescription } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import PlatformHealthGaugeCard from '../../components/analytics/PlatformHealthGaugeCard.jsx';
import MrrTrendChart from '../../components/analytics/MrrTrendChart.jsx';
import TenantGrowthChart from '../../components/analytics/TenantGrowthChart.jsx';
import AssetFleetIntelligenceCard from '../../components/analytics/AssetFleetIntelligenceCard.jsx';
import AssetFinancialExposureCard from '../../components/analytics/AssetFinancialExposureCard.jsx';
import OperationalAnalytics from '../../components/analytics/OperationalAnalytics.jsx';
import MaintenanceAnalytics from '../../components/analytics/MaintenanceAnalytics.jsx';
import PlatformSupportAnalytics from '../../components/analytics/PlatformSupportAnalytics.jsx';
import SlaAnalytics from '../../components/analytics/SlaAnalytics.jsx';
import WarrantyAnalytics from '../../components/analytics/WarrantyAnalytics.jsx';
import SecurityAndRiskCard from '../../components/analytics/SecurityAndRiskCard.jsx';
import OrganizationsRequiringAttention from '../../components/analytics/OrganizationsRequiringAttention.jsx';
import PlatformActivityTimeline from '../../components/analytics/PlatformActivityTimeline.jsx';
import { formatCurrency, formatRelative, formatDate } from '../../utils/formatters.js';

gsap.registerPlugin(ScrollTrigger);

export const SuperAdminAnalytics = () => {
  const navigate = useNavigate();

  // Filters State
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('all');

  const handleResetFilters = () => {
    setTimeRange('30d');
    setSelectedOrg('all');
    setSelectedPlan('all');
  };

  // 1. Fetch Consolidated SuperAdmin Analytics
  const {
    data: stats,
    isLoading,
    isRefetching,
    refetch
  } = useQuery({
    queryKey: ['admin-analytics', { timeRange, selectedOrg, selectedPlan }],
    queryFn: () =>
      adminApi.getAnalytics({
        timeRange,
        organizationId: selectedOrg !== 'all' ? selectedOrg : undefined,
        planId: selectedPlan !== 'all' ? selectedPlan : undefined
      })
  });

  // 2. Fetch Organizations List for Filter Dropdown
  const { data: orgsList = [] } = useQuery({
    queryKey: ['admin-organizations-filter'],
    queryFn: adminApi.getOrganizations
  });

  const sectionChartsRef = useRef(null);
  const sectionOperationsRef = useRef(null);

  // GSAP Animations
  useEffect(() => {
    const targets = [sectionChartsRef.current, sectionOperationsRef.current].filter(Boolean);
    const tweens = targets.map((el) =>
      gsap.fromTo(
        el,
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%'
          }
        }
      )
    );

    return () => {
      tweens.forEach((t) => {
        t.kill();
        if (t.scrollTrigger) t.scrollTrigger.kill();
      });
      targets.forEach((el) => gsap.set(el, { opacity: 1, y: 0, clearProps: 'all' }));
    };
  }, [stats]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" count={6} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-72 w-full rounded-2xl" />
          <Skeleton className="lg:col-span-5 h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const saas = stats?.saas || {};
  const assetFleet = stats?.assetFleet || {};
  const operationalTickets = stats?.operationalTickets || {};
  const maintenance = stats?.maintenance || {};
  const platformSupport = stats?.platformSupport || {};
  const sla = stats?.sla || {};
  const warranties = stats?.warranties || {};
  const userAnalytics = stats?.userAnalytics || {};
  const security = stats?.security || {};
  const attentionRequired = stats?.attentionRequired || [];
  const recentActivity = stats?.recentActivity || [];
  const platformHealth = stats?.platformHealth || {};
  const metadata = stats?.metadata || {};

  const kpis = [
    {
      title: 'Active Organizations',
      value: `${overview.activeOrganizations || 0} / ${overview.totalOrganizations || 0}`,
      delta: `+${overview.newOrgsThisMonth || 0}`,
      deltaLabel: 'new this month',
      icon: Building2,
      trend: [1, 1, 2, 2, overview.activeOrganizations || 2]
    },
    {
      title: 'Total Assets',
      value: (overview.totalAssets || 0).toLocaleString(),
      delta: overview.assetGrowthRate || '+22.4%',
      deltaLabel: 'fleet size',
      icon: HardDrive,
      trend: [20, 28, 35, overview.totalAssets || 45]
    },
    {
      title: 'Active Users',
      value: `${(overview.activeUsers || 0).toLocaleString()} / ${(overview.totalUsers || 0).toLocaleString()}`,
      delta: `${overview.inactiveUsers || 0} inactive`,
      deltaLabel: 'registered accounts',
      icon: Users,
      trend: [5, 8, 10, overview.totalUsers || 12]
    },
    {
      title: 'Fleet Health',
      value: `${overview.avgFleetHealth || 90} / 100`,
      delta: overview.avgFleetHealth >= 80 ? 'Optimal' : 'Attention',
      deltaLabel: 'AI diagnostic score',
      icon: Activity,
      trend: [90, 92, 94, overview.avgFleetHealth || 90]
    },
    {
      title: 'Open Operational Workload',
      value: overview.openOpWorkload || 0,
      delta: `${operationalTickets.open || 0} open backlog`,
      deltaLabel: 'active tickets',
      icon: Ticket,
      trend: [2, 4, 3, overview.openOpWorkload || 5]
    },
    {
      title: 'MRR',
      value: `$${(overview.totalMRR || 0).toLocaleString()}`,
      delta: `ARR: $${(overview.totalARR || 0).toLocaleString()}`,
      deltaLabel: 'annualized run-rate',
      icon: DollarSign,
      trend: [1000, 1150, 1300, 1400, overview.totalMRR || 1490]
    }
  ];

  const hasActiveFilters = timeRange !== '30d' || selectedOrg !== 'all' || selectedPlan !== 'all';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Platform Administration', to: '/admin/dashboard' },
          { label: 'Global Platform Intelligence' }
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Global Platform Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Platform-wide revenue, fleet, operations, support, and security command center
          </p>
        </div>

        {/* Refresh & Timestamp */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {metadata.generatedAt && (
            <span className="text-[11px] text-slate-400 font-mono">
              Updated {formatRelative(metadata.generatedAt)}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={isRefetching}
            onClick={() => refetch()}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <Card className="p-3.5" hoverLift={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Telemetry Scope:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time Range */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="12m">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>

            {/* Organization Filter */}
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 max-w-[180px] truncate"
            >
              <option value="all">All Organizations</option>
              {(Array.isArray(orgsList) ? orgsList : []).map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name}
                </option>
              ))}
            </select>

            {/* Plan Tier Filter */}
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="all">All Subscription Plans</option>
              {(saas.planDistribution || []).map((p) => (
                <option key={p._id || p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Reset Action */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="h-8 px-2.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* LEVEL 1: Platform Health Score Card */}
      <PlatformHealthGaugeCard health={platformHealth} />

      {/* LEVEL 1: 6 Core KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => (
          <KpiCard
            key={idx}
            title={kpi.title}
            value={kpi.value}
            delta={kpi.delta}
            deltaLabel={kpi.deltaLabel}
            icon={kpi.icon}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* LEVEL 1: Organizations Requiring Attention (Top Risk Card) */}
      <OrganizationsRequiringAttention organizations={attentionRequired} />

      {/* LEVEL 2: Platform Growth & Revenue Performance */}
      <div ref={sectionChartsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <MrrTrendChart
            growth={overview.mrrGrowthRate || '+14.8%'}
            data={saas.mrrTrend || [
              { month: 'Apr', value: 1000 },
              { month: 'May', value: 1150 },
              { month: 'Jun', value: 1300 },
              { month: 'Jul', value: 1400 },
              { month: 'Aug', value: overview.totalMRR || 1490 }
            ]}
          />
        </div>
        <div className="lg:col-span-5">
          <TenantGrowthChart
            data={saas.tenantGrowthTrend || [
              { period: 'Q1', count: 1 },
              { period: 'Q2', count: 1 },
              { period: 'Q3', count: 2 },
              { period: 'Q4', count: 2 },
              { period: 'Now', count: overview.activeOrganizations || 3 }
            ]}
          />
        </div>
      </div>

      {/* LEVEL 2: Asset Fleet Intelligence & Financial Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <AssetFleetIntelligenceCard data={assetFleet} />
        </div>
        <div className="lg:col-span-5">
          <AssetFinancialExposureCard assetFleet={assetFleet} />
        </div>
      </div>

      {/* LEVEL 2: Operations & Maintenance Grid */}
      <div ref={sectionOperationsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OperationalAnalytics data={operationalTickets} />
        <MaintenanceAnalytics data={maintenance} />
      </div>

      {/* LEVEL 2: Platform Support & SLA Compliance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformSupportAnalytics data={platformSupport} />
        <SlaAnalytics data={sla} />
      </div>

      {/* LEVEL 2: Subscription Distribution & Warranty Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dynamic Plan Subscriptions Card */}
        <div className="lg:col-span-6">
          <Card hoverLift className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <div>
                  <CardTitle>Subscription Plan Distribution</CardTitle>
                  <CardDescription>Tenant distribution by active database plans</CardDescription>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Avg {saas.avgUsersPerTenant || 0} users / org
              </span>
            </div>

            <div className="space-y-3">
              {(saas.planDistribution || []).map((plan) => (
                <div
                  key={plan._id || plan.slug}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {plan.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Quota: {plan.maxAssets} Assets • {plan.maxEmployees} Users
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-purple-700 dark:text-purple-300 block">
                      {plan.subscribersCount} tenants ({plan.percent}%)
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      ${plan.mrr.toLocaleString()}/mo MRR
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Warranty Expiration Card */}
        <div className="lg:col-span-6">
          <WarrantyAnalytics data={warranties} />
        </div>
      </div>

      {/* LEVEL 3: User Roles & Security Risk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Role Distribution */}
        <div className="lg:col-span-6">
          <Card hoverLift className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <div>
                  <CardTitle>Platform User Accounts</CardTitle>
                  <CardDescription>Registered accounts by RBAC role</CardDescription>
                </div>
              </div>
              <Badge variant="purple">{userAnalytics.totalUsers || 0} Accounts</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[
                { role: 'Super Admin', count: userAnalytics.byRole?.super_admin || 0, badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
                { role: 'Org Admin', count: userAnalytics.byRole?.org_admin || 0, badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
                { role: 'Asset Manager', count: userAnalytics.byRole?.asset_manager || 0, badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
                { role: 'Employee', count: userAnalytics.byRole?.employee || 0, badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
              ].map((r) => (
                <div key={r.role} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{r.role}</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold ${r.badge}`}>
                    {r.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex justify-between border-t border-slate-100 dark:border-slate-800">
              <span>Active Accounts: <strong className="text-emerald-600">{userAnalytics.activeUsers || 0}</strong></span>
              <span>Inactive / Suspended: <strong className="text-slate-500">{userAnalytics.inactiveUsers || 0}</strong></span>
            </div>
          </Card>
        </div>

        {/* Security & Risk Card */}
        <div className="lg:col-span-6">
          <SecurityAndRiskCard security={security} />
        </div>
      </div>

      {/* LEVEL 3: Grouped Activity Telemetry Timeline with Filter Tabs */}
      <PlatformActivityTimeline activities={recentActivity} />
    </div>
  );
};

export default SuperAdminAnalytics;
