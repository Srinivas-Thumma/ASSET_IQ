import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  UserCheck,
  AlertTriangle,
  Wrench,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  ArrowRight,
  Activity,
  Laptop,
  CheckCircle2,
  Flame,
  ShieldCheck
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import HealthScoreBadge from '../../components/ui/HealthScoreBadge.jsx';
import ActivityFeed from '../../components/ui/ActivityFeed.jsx';
import { useTickets } from '../../hooks/useTickets.js';
import { useAssets } from '../../hooks/useAssets.js';
import { useAssignments } from '../../hooks/useAssignments.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { formatDate, formatRelative, getAssetHealthScore } from '../../utils/formatters.js';
import { getSLAInfo } from './TicketQueue.jsx';

export const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tickets, isLoading: isTicketsLoading } = useTickets();
  const { assets, isLoading: isAssetsLoading } = useAssets();
  const { inspections, isLoading: isInspectionsLoading } = useAssignments();

  const isLoading = isTicketsLoading || isAssetsLoading || isInspectionsLoading;

  // KPI Calculations
  const kpis = useMemo(() => {
    const openTicketsCount = tickets.filter((t) => t.status === 'open').length;
    const myActiveClaimsCount = tickets.filter((t) => (t.status === 'claimed' || t.status === 'in_progress') && (t.handler?._id === user?._id || t.handler === user?._id || !t.handler)).length;

    const slaAtRiskCount = tickets.filter((t) => {
      if (t.status === 'resolved' || t.status === 'closed') return false;
      const sla = getSLAInfo(t);
      return sla.hasSLA && (sla.color === 'red' || sla.color === 'amber');
    }).length;

    const assetsInRepairCount = assets.filter((a) => a.status === 'repair' || a.status === 'maintenance').length;
    const pendingInspectionsCount = inspections?.length || assets.filter((a) => a.status === 'return_pending').length;

    const validScores = assets.map((a) => getAssetHealthScore(a)).filter((s) => typeof s === 'number');
    const avgFleetHealth = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 95;

    return {
      openTicketsCount,
      myActiveClaimsCount,
      slaAtRiskCount,
      assetsInRepairCount,
      pendingInspectionsCount,
      avgFleetHealth
    };
  }, [tickets, assets, inspections, user]);

  // Priority Distribution
  const priorityDistribution = useMemo(() => {
    const counts = { p1: 0, p2: 0, p3: 0, p4: 0, triage: 0 };
    tickets.forEach((t) => {
      if (t.status !== 'resolved' && t.status !== 'closed') {
        const p = t.priority?.toLowerCase();
        if (p === 'p1') counts.p1++;
        else if (p === 'p2') counts.p2++;
        else if (p === 'p3') counts.p3++;
        else if (p === 'p4') counts.p4++;
        else counts.triage++;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return { counts, total };
  }, [tickets]);

  // Declining / Low Health Assets
  const lowHealthAssets = useMemo(() => {
    return [...assets]
      .sort((a, b) => getAssetHealthScore(a) - getAssetHealthScore(b))
      .slice(0, 5);
  }, [assets]);

  // Recent Activity Feed
  const recentActivities = useMemo(() => {
    const activities = [];

    tickets.slice(0, 6).forEach((t) => {
      activities.push({
        id: `ticket-${t._id}`,
        actor: t.raisedBy?.email?.split('@')[0] || 'Employee',
        action: `Submitted ticket "${t.title}"`,
        targetType: 'ticket',
        targetId: t._id,
        targetName: t.ticketCode || 'TKT',
        createdAt: t.createdAt
      });
    });

    assets.slice(0, 4).forEach((a) => {
      activities.push({
        id: `asset-${a._id}`,
        actor: 'Telemetry AI',
        action: `Diagnosed health score ${getAssetHealthScore(a)}/100`,
        targetType: 'asset',
        targetId: a._id,
        targetName: a.name,
        createdAt: a.updatedAt || a.createdAt
      });
    });

    return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [tickets, assets]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Skeleton className="h-28 rounded-xl" count={6} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            IT Operations & Fleet Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time queue health, active workbench SLAs, and multi-tenant fleet reliability telemetry
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            icon={Laptop}
            onClick={() => navigate('/assets')}
          >
            Asset Inventory
          </Button>
          <Button
            variant="primary"
            icon={Ticket}
            onClick={() => navigate('/tickets')}
          >
            Triage Queue
          </Button>
        </div>
      </div>

      {/* 6 Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Open in Triage"
          value={kpis.openTicketsCount}
          delta={kpis.openTicketsCount > 0 ? `${kpis.openTicketsCount} pending` : 'All Triaged'}
          deltaLabel="unclaimed"
          isPositive={kpis.openTicketsCount === 0}
          alertDot={kpis.openTicketsCount > 0}
          icon={Ticket}
          onClick={() => navigate('/tickets')}
        />

        <KpiCard
          title="My Active Claims"
          value={kpis.myActiveClaimsCount}
          delta="Assigned"
          deltaLabel="in-progress"
          isPositive={true}
          icon={UserCheck}
          onClick={() => navigate('/tickets')}
        />

        <KpiCard
          title="SLA Risk / Overdue"
          value={kpis.slaAtRiskCount}
          delta={kpis.slaAtRiskCount > 0 ? `${kpis.slaAtRiskCount} Breaching` : 'All On-Track'}
          deltaLabel="target response"
          isPositive={kpis.slaAtRiskCount === 0}
          alertDot={kpis.slaAtRiskCount > 0}
          icon={AlertTriangle}
          onClick={() => navigate('/tickets')}
        />

        <KpiCard
          title="Hardware in Repair"
          value={kpis.assetsInRepairCount}
          delta="Service Desk"
          deltaLabel="vendor RMA"
          isPositive={true}
          icon={Wrench}
          onClick={() => navigate('/assets')}
        />

        <KpiCard
          title="Pending Returns"
          value={kpis.pendingInspectionsCount}
          delta={kpis.pendingInspectionsCount > 0 ? `${kpis.pendingInspectionsCount} to inspect` : 'Cleared'}
          deltaLabel="intake custody"
          isPositive={kpis.pendingInspectionsCount === 0}
          icon={RotateCcw}
          onClick={() => navigate('/inspections')}
        />

        <KpiCard
          title="Avg Fleet Health"
          value={`${kpis.avgFleetHealth} / 100`}
          delta={kpis.avgFleetHealth >= 80 ? 'Optimal' : 'Needs Review'}
          deltaLabel="AI condition"
          isPositive={kpis.avgFleetHealth >= 80}
          icon={ShieldCheck}
        />
      </div>

      {/* Grid: Priority Distribution & AI Health Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Distribution */}
        <Card className="lg:col-span-6" hoverLift>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle>Ticket Severity Distribution</CardTitle>
              <CardDescription>Active issues categorized by operational priority tier</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tickets')}
              className="text-xs text-[#6D28D9] dark:text-purple-300"
            >
              Open Workbench
            </Button>
          </div>

          <div className="space-y-3">
            {[
              { key: 'p1', label: 'P1 — Critical / Outage', count: priorityDistribution.counts.p1, color: 'destructive' },
              { key: 'p2', label: 'P2 — Major / Degraded', count: priorityDistribution.counts.p2, color: 'amber' },
              { key: 'p3', label: 'P3 — Moderate Service', count: priorityDistribution.counts.p3, color: 'purple' },
              { key: 'p4', label: 'P4 — Minor Inquiry', count: priorityDistribution.counts.p4, color: 'emerald' },
              { key: 'triage', label: 'Unassigned / Needs Triage', count: priorityDistribution.counts.triage, color: 'purple' }
            ].map((p) => {
              const pct = Math.round((p.count / priorityDistribution.total) * 100);
              return (
                <div key={p.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{p.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{p.count} ({pct}%)</span>
                  </div>
                  <ProgressBar value={p.count} max={priorityDistribution.total} colorVariant={p.color} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* AI Health Watchlist */}
        <Card className="lg:col-span-6" hoverLift>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle>Fleet Health Watchlist</CardTitle>
              <CardDescription>Hardware with lowest diagnostic scores</CardDescription>
            </div>
            <Badge variant="warning">AI Monitored</Badge>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {lowHealthAssets.map((asset) => {
              const score = getAssetHealthScore(asset);
              return (
                <div
                  key={asset._id}
                  onClick={() => navigate(`/assets/${asset._id}`)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#6D28D9] flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/60">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white truncate block">
                        {asset.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {asset.assetCode} • {asset.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <HealthScoreBadge score={score} size="sm" />
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Operational Activity Stream */}
      <ActivityFeed
        events={recentActivities}
        title="Live IT Operational Events"
        description="Ticket dispatches, hardware allocations, and diagnostic telemetry"
        maxItems={5}
      />
    </div>
  );
};

export default ManagerDashboard;
