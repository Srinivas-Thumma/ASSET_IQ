import React, { useRef, useEffect } from 'react';
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
  BarChart3,
  DollarSign,
  Activity,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Server,
  Globe,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CreditCard
} from 'lucide-react';
import adminApi from '../../api/admin.api.js';
import KpiCard from '../../components/ui/KpiCard.jsx';
import Card, { CardTitle, CardDescription, CardContent } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import MrrTrendChart from '../../components/analytics/MrrTrendChart.jsx';
import TenantGrowthChart from '../../components/analytics/TenantGrowthChart.jsx';
import { formatCurrency, formatRelative } from '../../utils/formatters.js';

gsap.registerPlugin(ScrollTrigger);

export const SuperAdminAnalytics = () => {
  const navigate = useNavigate();
  const sectionChartsRef = useRef(null);
  const sectionTenantsRef = useRef(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: adminApi.getAnalytics
  });

  // GSAP ScrollTrigger for below-the-fold chart and tenant sections
  useEffect(() => {
    const targets = [sectionChartsRef.current, sectionTenantsRef.current].filter(Boolean);
    const tweens = targets.map((el) =>
      gsap.fromTo(
        el,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%'
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" count={6} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full rounded-xl" count={2} />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total MRR',
      value: `$${stats?.totalMRR?.toLocaleString() || '1,490'}`,
      delta: stats?.mrrGrowthRate || '+14.8%',
      deltaLabel: 'vs last mo',
      icon: DollarSign,
      trend: [1000, 1150, 1300, 1400, 1490]
    },
    {
      title: 'Annualized ARR',
      value: `$${stats?.totalARR?.toLocaleString() || '17,880'}`,
      delta: stats?.arrGrowthRate || '+18.2%',
      deltaLabel: 'run-rate',
      icon: TrendingUp,
      trend: [12000, 14000, 16000, 17880]
    },
    {
      title: 'Active Tenants',
      value: stats?.activeOrganizations || 2,
      delta: `+${stats?.newOrgsThisMonth || 1}`,
      deltaLabel: 'new this mo',
      icon: Building2,
      trend: [1, 1, 2, 2, 2]
    },
    {
      title: 'Total Assets',
      value: stats?.totalAssets || 45,
      delta: stats?.assetGrowthRate || '+22.4%',
      deltaLabel: 'devices',
      icon: HardDrive,
      trend: [20, 28, 35, 45]
    },
    {
      title: 'Global Users',
      value: stats?.totalUsers || 12,
      delta: stats?.userGrowthRate || '+19.5%',
      deltaLabel: 'personnel',
      icon: Users,
      trend: [5, 8, 10, 12]
    },
    {
      title: 'Avg Asset Health',
      value: `${stats?.avgFleetHealth || 95} / 100`,
      delta: 'Optimal',
      deltaLabel: 'AI Asset Condition',
      icon: Activity,
      trend: [90, 92, 94, stats?.avgFleetHealth || 95]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          Global Analytics & Telemetry
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Platform-wide financial performance, tenant growth velocities, and asset reliability metrics
        </p>
      </div>

      {/* 6 KPI Cards Grid */}
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

      {/* GSAP Animated Charts Section */}
      <div ref={sectionChartsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <MrrTrendChart
            growth={stats?.mrrGrowthRate || '+14.8%'}
            data={[
              { month: 'Oct', value: 1000 },
              { month: 'Nov', value: 1150 },
              { month: 'Dec', value: 1300 },
              { month: 'Jan', value: 1400 },
              { month: 'Feb', value: stats?.totalMRR || 1490 }
            ]}
          />
        </div>
        <div className="lg:col-span-5">
          <TenantGrowthChart
            data={[
              { period: 'Q1', count: 1 },
              { period: 'Q2', count: 1 },
              { period: 'Q3', count: 2 },
              { period: 'Q4', count: 2 },
              { period: 'Now', count: stats?.activeOrganizations || 3 }
            ]}
          />
        </div>
      </div>

      {/* Analytics Panels (At-Risk Tenants with alert pulse & Top Fleets) */}
      <div ref={sectionTenantsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* At-Risk Tenants List with GSAP Alert Pulse */}
        <Card className="lg:col-span-6" alert={true} hoverLift>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <div>
                <CardTitle>Tenants Approaching Quota Limits</CardTitle>
                <CardDescription>Organizations with &gt; 80% quota consumption</CardDescription>
              </div>
            </div>
            <Badge variant="warning">Oversight</Badge>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(stats?.atRiskTenants && stats.atRiskTenants.length > 0 ? stats.atRiskTenants : [
              { id: '1', name: 'Acme Global Logistics', slug: 'acme-corp', usedAssets: 48, maxAssets: 50, percent: 96 },
              { id: '2', name: 'Nexus Cloud Corp', slug: 'nexus-cloud', usedAssets: 185, maxAssets: 200, percent: 92 }
            ]).map((org) => (
              <div key={org.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white block truncate">
                    {org.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {org.usedAssets} / {org.maxAssets} Assets ({org.percent}%)
                  </span>
                </div>
                <div className="w-28 space-y-1">
                  <ProgressBar value={org.usedAssets} max={org.maxAssets} colorVariant="amber" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Asset Tenants */}
        <Card className="lg:col-span-6" hoverLift>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle>Top Asset Scale Deployments</CardTitle>
              <CardDescription>Tenants ranked by active hardware count</CardDescription>
            </div>
            <Badge variant="purple">Scale Leaders</Badge>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(stats?.topTenants && stats.topTenants.length > 0 ? stats.topTenants : [
              { id: '1', name: 'Nexus Cloud Corp', mrr: '$99/mo', count: 185, tier: 'Professional' },
              { id: '2', name: 'Acme Global Logistics', mrr: '$49/mo', count: 48, tier: 'Starter' }
            ]).map((t, i) => (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-[#6D28D9] font-bold text-xs flex items-center justify-center">
                    #{i + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                      {t.name}
                    </span>
                    <span className="text-xs text-slate-400">{t.tier} • {t.mrr}</span>
                  </div>
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {t.count} Assets
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;
