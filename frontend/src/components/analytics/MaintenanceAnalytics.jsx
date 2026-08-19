import React from 'react';
import {
  Wrench,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export const MaintenanceAnalytics = ({ data = {} }) => {
  const total = data.totalRequests || 0;
  const open = data.open || 0;
  const inProgress = data.inProgress || 0;
  const resolved = data.resolved || 0;
  const avgHours = data.avgRepairHours || 0;

  if (total === 0) {
    return (
      <Card hoverLift className="p-6 text-center text-slate-400">
        <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <CardTitle>Maintenance & Repair Operations</CardTitle>
        <p className="text-xs text-slate-500 mt-1">No hardware maintenance tickets filed in this period.</p>
      </Card>
    );
  }

  const resolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <Card hoverLift className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Hardware Maintenance & Repairs</CardTitle>
            <CardDescription>Breakdown and turnaround for physical asset repair requests</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">{total} Repair Tickets</Badge>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {resolvedRate}% Completed
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Open Repairs</span>
          <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{open}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Under Service</span>
          <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{inProgress}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Resolved</span>
          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{resolved}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Turnaround</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white">{avgHours}h</span>
        </div>
      </div>

      <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
        <span>Hardware Under Repair: <strong className="text-amber-700 dark:text-amber-300">{inProgress + open} devices</strong></span>
        <span>Resolution Efficiency: <strong className="text-emerald-700 dark:text-emerald-300">{resolvedRate}%</strong></span>
      </div>
    </Card>
  );
};

export default MaintenanceAnalytics;
