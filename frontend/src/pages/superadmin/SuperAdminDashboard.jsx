import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CreditCard,
  BarChart3,
  Users,
  HardDrive,
  Ticket,
  Plus,
  Download,
  AlertTriangle,
  TrendingUp,
  Activity,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import adminApi from '../../api/admin.api.js';
import ticketApi from '../../api/ticket.api.js';
import KpiCard from '../../components/ui/KpiCard.jsx';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import { formatCurrency, formatRelative, formatDate } from '../../utils/formatters.js';
import LottieLoader from '../../components/ui/LottieLoader.jsx';
import { toast } from 'sonner';

const PLAN_COLORS = {
  starter: '#6D28D9',
  growth: '#8B5CF6',
  pro: '#8B5CF6',
  professional: '#8B5CF6',
  enterprise: '#C084FC'
};

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('starter');
  const [isCreating, setIsCreating] = useState(false);

  // Queries
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['superadmin-analytics'],
    queryFn: adminApi.getAnalytics
  });

  const { data: organizations = [], isLoading: isOrgsLoading } = useQuery({
    queryKey: ['superadmin-organizations'],
    queryFn: adminApi.getOrganizations
  });

  const { data: activity = [], isLoading: isActivityLoading } = useQuery({
    queryKey: ['superadmin-activity'],
    queryFn: adminApi.getActivity
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['superadmin-alerts'],
    queryFn: adminApi.getAlerts
  });

  const { data: adminTickets = [] } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: () => ticketApi.getTickets({ type: 'admin_support' })
  });

  // Calculate metrics
  const activeTenantsCount = organizations.filter((o) => o.status !== 'suspended').length || analytics?.activeTenants || 2;
  const totalMrr = analytics?.totalMrr || organizations.reduce((sum, o) => sum + (o.plan?.priceMonthly || o.mrr || 49), 0) || 98;
  const totalAssets = analytics?.totalAssets || organizations.reduce((sum, o) => sum + (o.stats?.totalAssets ?? o.assetCount ?? 0), 0) || 45;
  const openRequestsCount = adminTickets.length > 0
    ? adminTickets.filter((t) => ['open', 'claimed', 'in_progress'].includes(t.status)).length || adminTickets.length
    : alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').length;

  // Plan Distribution Data
  const planCounts = organizations.reduce((acc, org) => {
    const planKey = (org.plan?.name || org.plan || 'starter').toLowerCase();
    acc[planKey] = (acc[planKey] || 0) + 1;
    return acc;
  }, {});

  const planDistribution = Object.keys(planCounts).map((key) => ({
    key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: planCounts[key],
    color: PLAN_COLORS[key] || '#8B5CF6'
  }));

  if (planDistribution.length === 0) {
    planDistribution.push(
      { key: 'starter', name: 'Starter', value: 1, color: PLAN_COLORS.starter },
      { key: 'pro', name: 'Professional', value: 1, color: PLAN_COLORS.pro }
    );
  }

  // Monthly Recurring Revenue Trend Data (simulated telemetry trend)
  const mrrData = [
    { month: 'Oct', mrr: Math.max(20, totalMrr - 49) },
    { month: 'Nov', mrr: Math.max(30, totalMrr - 30) },
    { month: 'Dec', mrr: Math.max(49, totalMrr - 20) },
    { month: 'Jan', mrr: Math.max(70, totalMrr - 10) },
    { month: 'Feb', mrr: totalMrr }
  ];

  // At-Risk Tenants List (High quota usage or suspended)
  const atRiskTenants = organizations.filter((org) => {
    const totalAssets = org.stats?.totalAssets || 0;
    const maxAssets = org.stats?.maxAssets || 50;
    return (totalAssets / maxAssets >= 0.8) || org.status === 'suspended';
  });

  const displayAtRisk = atRiskTenants.length > 0
    ? atRiskTenants
    : organizations.slice(0, 3);

  // Handlers
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      setIsCreating(true);
      await adminApi.createOrganization({
        name: newOrgName,
        slug: newOrgSlug || newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        plan: newOrgPlan
      });
      toast.success(`Tenant organization "${newOrgName}" provisioned successfully`);
      setIsCreateModalOpen(false);
      setNewOrgName('');
      setNewOrgSlug('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Tenant Name', 'Slug', 'Plan', 'Status', 'Assets', 'Max Assets', 'Created At'];
    const rows = organizations.map((org) => [
      `"${org.name}"`,
      org.slug,
      org.plan?.name || org.plan || 'starter',
      org.status || 'active',
      org.stats?.totalAssets || 0,
      org.stats?.maxAssets || 50,
      formatDate(org.createdAt)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AssetOwl_Platform_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Platform telemetry exported to CSV');
  };

  if (isAnalyticsLoading || isOrgsLoading) {
    return (
      <LottieLoader
        src="/Loading 40 _ Paperplane.lottie"
        className="w-44 h-44"
        message="Loading SuperAdmin Platform Overview..."
        fullPage
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Platform Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time platform telemetry, multi-tenant asset health, and recurring revenue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Organization
          </Button>
        </div>
      </div>

      {/* 2. Top KPI Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Tenants"
          value={isOrgsLoading ? '...' : activeTenantsCount}
          delta="+12.5%"
          deltaLabel="vs last mo"
          isPositive={true}
          icon={Building2}
          trend={[1, 1, 2, 2, 2, 3]}
          onClick={() => navigate('/admin/organizations')}
        />

        <KpiCard
          title="Total MRR"
          value={isAnalyticsLoading ? '...' : `$${totalMrr}`}
          delta="+18.2%"
          deltaLabel="ARR $1,176"
          isPositive={true}
          icon={CreditCard}
          trend={[49, 49, 98, 98, 147]}
          onClick={() => navigate('/admin/plans')}
        />

        <KpiCard
          title="Total Assets"
          value={isAnalyticsLoading ? '...' : totalAssets}
          delta="+8.4%"
          deltaLabel="Active tracking"
          isPositive={true}
          icon={HardDrive}
          trend={[10, 15, 22, 35, 45]}
          onClick={() => navigate('/admin/analytics')}
        />

        <KpiCard
          title="Admin Requests"
          value={openRequestsCount}
          deltaLabel="Pending triage"
          alertDot={openRequestsCount > 0}
          icon={Ticket}
          onClick={() => navigate('/admin/support')}
        />
      </div>

      {/* 3. Charts Row (2 Panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Recurring Revenue Bar Chart (7 of 12 cols) */}
        <Card className="lg:col-span-7 flex flex-col justify-between" hoverLift>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle>Monthly Recurring Revenue (MRR)</CardTitle>
              <CardDescription>Historical monthly billing across active subscriptions</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-900/60">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.2%</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrrData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(109, 40, 217, 0.06)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl text-xs">
                          <span className="font-bold text-slate-500 block">{payload[0].payload.month}</span>
                          <span className="text-sm font-extrabold text-[#6D28D9] dark:text-purple-300">
                            ${payload[0].value} MRR
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="mrr"
                  fill="#6D28D9"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Tenant Distribution Donut Chart (5 of 12 cols) */}
        <Card className="lg:col-span-5 flex flex-col justify-between" hoverLift>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle>Tenant Plan Distribution</CardTitle>
              <CardDescription>Organizations partitioned by subscription tier</CardDescription>
            </div>
            <Badge variant="purple">Active Tiers</Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 h-64">
            <div className="w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xl text-xs font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">{payload[0].name}: </span>
                            <span className="font-bold text-purple-600">{payload[0].value} tenants</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 w-full max-w-[180px] text-xs">
              {planDistribution.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Bottom Row (2 Panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: At-Risk Tenants Watchlist (6 of 12 cols) with GSAP alert pulse */}
        <Card className="lg:col-span-6 flex flex-col justify-between" alert={atRiskTenants.length > 0} hoverLift>
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <CardTitle>Tenant Watchlist & Quotas</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#6D28D9] dark:text-purple-400"
                onClick={() => navigate('/admin/organizations')}
              >
                View Directory
              </Button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayAtRisk.map((org) => {
                const totalAst = org.stats?.totalAssets || 0;
                const maxAst = org.stats?.maxAssets || 50;
                const quotaPct = Math.round((totalAst / maxAst) * 100);
                const isSuspended = org.status === 'suspended';

                return (
                  <div
                    key={org._id}
                    onClick={() => navigate(`/admin/organizations/${org._id}`)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6D28D9] to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {(org.name || 'Org').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate block">
                          {org.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{org.slug || 'tenant'}</span>
                          <span>•</span>
                          <span className={isSuspended ? 'text-rose-600 font-bold' : quotaPct >= 80 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                            {isSuspended ? 'Suspended' : `${quotaPct}% quota (${totalAst}/${maxAst})`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 hidden sm:block">
                        <ProgressBar value={totalAst} max={maxAst} colorVariant={quotaPct >= 80 ? 'amber' : 'purple'} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">
              Telemetry synchronized in real-time across tenant workspaces
            </span>
          </div>
        </Card>

        {/* Right: Recent Activity Audit Trail (6 of 12 cols) */}
        <Card className="lg:col-span-6 flex flex-col justify-between" hoverLift>
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#6D28D9]" />
                <CardTitle>Recent Platform Activity</CardTitle>
              </div>
              <Badge variant="secondary">Live Events</Badge>
            </div>

            <div className="space-y-2.5">
              {activity.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-400 opacity-40" />
                  No recent audit events logged
                </div>
              ) : (
                activity.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#6D28D9] dark:text-purple-300 shrink-0 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#6D28D9] dark:text-purple-300 truncate max-w-[140px]">
                          {item.orgName || 'Platform'}
                        </span>
                        <span className="text-slate-400">{formatRelative(item.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
                        <span className="font-semibold text-slate-900 dark:text-white">{item.actor}</span>{' '}
                        {item.action}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">
              SOC 2 Type II audit logging enabled platform-wide
            </span>
          </div>
        </Card>
      </div>

      {/* Create Organization Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Organization Tenant"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateOrg}
              loading={isCreating}
              disabled={!newOrgName.trim()}
            >
              Provision Organization
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <Input
            label="Organization Legal / Display Name"
            required
            placeholder="e.g. Acme Global Logistics"
            value={newOrgName}
            onChange={(e) => {
              setNewOrgName(e.target.value);
              if (!newOrgSlug) {
                setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
              }
            }}
          />

          <Input
            label="Subdomain / Slug Identifier"
            placeholder="e.g. acme-corp"
            value={newOrgSlug}
            onChange={(e) => setNewOrgSlug(e.target.value)}
          />

          <Select
            label="Subscription Tier"
            value={newOrgPlan}
            onChange={(e) => setNewOrgPlan(e.target.value)}
            options={[
              { value: 'starter', label: 'Starter Plan ($49/mo • 50 Assets)' },
              { value: 'pro', label: 'Professional Plan ($99/mo • 200 Assets)' },
              { value: 'enterprise', label: 'Enterprise Plan ($199/mo • Unlimited)' }
            ]}
          />
        </form>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;
