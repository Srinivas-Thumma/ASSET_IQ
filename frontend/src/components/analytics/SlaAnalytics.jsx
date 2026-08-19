import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export const SlaAnalytics = ({ data = {} }) => {
  const complianceRate = data.overallComplianceRate ?? 100;
  const metCount = data.slaMetCount || 0;
  const breachedCount = data.slaBreachedCount || 0;
  const activeOverdue = data.activeOverdueCount || 0;
  const activeApproaching = data.activeApproachingCount || 0;
  const metrics = data.metrics || [];

  return (
    <Card hoverLift className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>SLA Health & Priority Compliance</CardTitle>
            <CardDescription>Target resolution turnaround adherence across all priority tiers</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              complianceRate >= 90
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : complianceRate >= 75
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {complianceRate}% Compliance Rate
          </span>
        </div>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">SLA Met</span>
          <span className="text-lg font-extrabold text-emerald-900 dark:text-emerald-100">{metCount}</span>
        </div>

        <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 text-center">
          <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 block">SLA Breached</span>
          <span className="text-lg font-extrabold text-rose-900 dark:text-rose-100">{breachedCount}</span>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Live Overdue</span>
          <span className="text-lg font-extrabold text-amber-900 dark:text-amber-100">{activeOverdue}</span>
        </div>

        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 text-center">
          <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 block">Approaching Deadline</span>
          <span className="text-lg font-extrabold text-indigo-900 dark:text-indigo-100">{activeApproaching}</span>
        </div>
      </div>

      {/* Priority Targets Table */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Tier SLA Thresholds & Adherence
        </span>
        <div className="divide-y divide-slate-200/40 dark:divide-slate-700/40 text-xs">
          {metrics.map((m, idx) => (
            <div key={idx} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">{m.priority}</span>
                <span className="text-[11px] text-slate-400 font-mono">({m.targetHours} Target)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{m.total} evaluated</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.metRate} Met</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default SlaAnalytics;
