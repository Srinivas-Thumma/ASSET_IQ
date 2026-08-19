import React from 'react';
import {
  ShieldCheck,
  Activity,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Building2,
  HardDrive,
  Zap
} from 'lucide-react';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export const PlatformHealthSummary = ({ health = {} }) => {
  const indicators = [
    {
      title: 'Tenant Health',
      status: health.tenantHealth || 'Healthy',
      icon: Building2,
      isPositive: health.tenantHealth === 'Healthy',
      desc: health.tenantHealth === 'Healthy' ? 'All organizations active' : health.tenantHealth
    },
    {
      title: 'Fleet Health',
      status: health.fleetHealth || 'Healthy',
      icon: HardDrive,
      isPositive: health.fleetHealth === 'Healthy',
      desc: health.fleetHealth === 'Healthy' ? 'Fleet condition nominal' : 'Attention required'
    },
    {
      title: 'Support Health',
      status: health.supportHealth || 'Optimal',
      icon: LifeBuoy,
      isPositive: health.supportHealth === 'Optimal',
      desc: health.supportHealth === 'Optimal' ? 'No support case backlog' : 'Active queue'
    },
    {
      title: 'SLA Health',
      status: health.slaHealth || 'Healthy',
      icon: ShieldCheck,
      isPositive: health.slaHealth === 'Healthy',
      desc: health.slaHealth === 'Healthy' ? '>= 90% compliance' : 'Threshold warning'
    },
    {
      title: 'System Activity',
      status: health.activityHealth || 'Active',
      icon: Zap,
      isPositive: true,
      desc: 'Telemetry operational'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {indicators.map((ind, idx) => {
        const Icon = ind.icon;
        return (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  ind.isPositive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate uppercase tracking-wider">
                  {ind.title}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                  {ind.status}
                </span>
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                ind.isPositive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default PlatformHealthSummary;
