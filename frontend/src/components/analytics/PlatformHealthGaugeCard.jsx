import React from 'react';
import {
  Activity,
  ShieldCheck,
  Building2,
  HardDrive,
  LifeBuoy,
  Zap,
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export const PlatformHealthGaugeCard = ({ health = {} }) => {
  const score = health.score ?? 85;
  const statusLabel = health.statusLabel || (score >= 85 ? 'Healthy' : score >= 70 ? 'Attention Required' : 'Critical Risk');

  const getStatusColor = () => {
    if (score >= 85) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800', bar: 'bg-emerald-500' };
    if (score >= 70) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800', bar: 'bg-amber-500' };
    return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800', bar: 'bg-rose-500' };
  };

  const theme = getStatusColor();

  const items = [
    { title: 'Tenant Health', value: health.tenantHealth || 'Healthy', icon: Building2 },
    { title: 'Fleet Health', value: health.fleetHealth || 'Healthy', icon: HardDrive },
    { title: 'Support Queue', value: health.supportHealth || 'Optimal', icon: LifeBuoy },
    { title: 'SLA Adherence', value: health.slaHealth || 'Healthy', icon: ShieldCheck },
    { title: 'Operations', value: health.opsHealth || 'Optimal', icon: Zap },
    { title: 'Security Risk', value: health.securityHealth || 'Operational', icon: Lock }
  ];

  return (
    <Card hoverLift={false} className="p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: 0-100 Health Score Gauge */}
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl border ${theme.bg} flex items-center justify-center shrink-0`}>
            <div className="text-center">
              <span className={`text-3xl font-black font-mono tracking-tight block ${theme.text}`}>
                {score}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                / 100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                PLATFORM HEALTH SCORE
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${theme.bg} ${theme.text}`}>
                {statusLabel}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              AssetOwl System Operational Status
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Weighted composite evaluating tenants, hardware condition, SLA compliance, and open risk
            </p>
          </div>
        </div>

        {/* Right: Score Progress Bar */}
        <div className="w-full md:w-64 space-y-1.5 self-center">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500">Overall Condition</span>
            <span className={theme.text}>{score}% Optimal</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div style={{ width: `${score}%` }} className={`h-full ${theme.bar} transition-all duration-500`} />
          </div>
        </div>
      </div>

      {/* Component Health Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block truncate uppercase">
                  {item.title}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default PlatformHealthGaugeCard;
