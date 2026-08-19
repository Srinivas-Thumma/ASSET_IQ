import React from 'react';
import {
  Ticket,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  PlusSquare,
  Wrench
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export const OperationalAnalytics = ({ data = {} }) => {
  const total = data.totalTickets || 0;
  const open = data.open || 0;
  const inProgress = data.inProgress || 0;
  const resolved = data.resolved || 0;
  const byType = data.byType || { repair: 0, request: 0, return: 0, support: 0 };
  const byPriority = data.byPriority || { p1: 0, p2: 0, p3: 0, p4: 0 };

  if (total === 0) {
    return (
      <Card hoverLift className="p-6 text-center text-slate-400">
        <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <CardTitle>Organization Operational Tickets</CardTitle>
        <p className="text-xs text-slate-500 mt-1">No internal operational tickets filed in this period.</p>
      </Card>
    );
  }

  return (
    <Card hoverLift className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Operational IT Ticket Activity</CardTitle>
            <CardDescription>Employee $\leftrightarrow$ Asset Manager tickets (Repairs, Requests, Returns)</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="indigo">{total} Total Tickets</Badge>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {data.resolutionRate || 0}% Resolved
          </span>
        </div>
      </div>

      {/* Lifecycle Status Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-center">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block">Open Backlog</span>
          <span className="text-xl font-extrabold text-amber-900 dark:text-amber-100">{open}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-center">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase block">In Progress</span>
          <span className="text-xl font-extrabold text-indigo-900 dark:text-indigo-100">{inProgress}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-center">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Resolved</span>
          <span className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100">{resolved}</span>
        </div>
      </div>

      {/* Type & Priority Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* By Ticket Type */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Tickets by Type
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-700/40">
              <span className="text-slate-500">Hardware Repairs</span>
              <span className="font-bold text-slate-900 dark:text-white">{byType.repair}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-700/40">
              <span className="text-slate-500">Procurement</span>
              <span className="font-bold text-slate-900 dark:text-white">{byType.request}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Asset Returns</span>
              <span className="font-bold text-slate-900 dark:text-white">{byType.return}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">General Support</span>
              <span className="font-bold text-slate-900 dark:text-white">{byType.support}</span>
            </div>
          </div>
        </div>

        {/* By Priority */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Priority Distribution
          </span>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="p-2 rounded-lg bg-rose-100/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block">P1</span>
              <span className="text-sm font-extrabold text-rose-900 dark:text-rose-100">{byPriority.p1}</span>
            </div>
            <div className="p-2 rounded-lg bg-orange-100/60 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40">
              <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 block">P2</span>
              <span className="text-sm font-extrabold text-orange-900 dark:text-orange-100">{byPriority.p2}</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">P3</span>
              <span className="text-sm font-extrabold text-amber-900 dark:text-amber-100">{byPriority.p3}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600/40">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">P4</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">{byPriority.p4}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
        <span>Average Turnaround Time: <strong className="text-slate-800 dark:text-slate-200">{data.avgResolutionHours || 0} hours</strong></span>
        <span>Lifecycle: <strong className="text-slate-700 dark:text-slate-300">Open $\rightarrow$ Claim $\rightarrow$ In Progress $\rightarrow$ Resolved $\rightarrow$ Closed</strong></span>
      </div>
    </Card>
  );
};

export default OperationalAnalytics;
