import React from 'react';
import {
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  Clock,
  PlayCircle,
  HelpCircle
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export const PlatformSupportAnalytics = ({ data = {} }) => {
  const total = data.totalCases || 0;
  const open = data.open || 0;
  const inProgress = data.inProgress || 0;
  const resolved = data.resolved || 0;
  const byCategory = data.byCategory || { billing: 0, plan_upgrade: 0, policy: 0, technical: 0, other: 0 };
  const byPriority = data.byPriority || { p1: 0, p2: 0, p3: 0, p4: 0 };

  if (total === 0) {
    return (
      <Card hoverLift className="p-6 text-center text-slate-400">
        <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <CardTitle>Platform Support Cases</CardTitle>
        <p className="text-xs text-slate-500 mt-1">No platform support cases filed by Organization Admins.</p>
      </Card>
    );
  }

  const categoryLabels = {
    billing: 'Billing & Subscriptions',
    plan_upgrade: 'Plan & Quotas',
    policy: 'Configuration & Access',
    technical: 'Technical Issues',
    other: 'General / Other'
  };

  return (
    <Card hoverLift className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <LifeBuoy className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Platform Support Cases</CardTitle>
            <CardDescription>Org Admin ↔ SuperAdmin enterprise support inquiries</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="purple">{total} Total Cases</Badge>
          <span className="text-xs text-slate-500">
            Avg Turnaround: <strong className="text-slate-800 dark:text-slate-200">{data.avgResolutionHours || 0}h</strong>
          </span>
        </div>
      </div>

      {/* 3-State Lifecycle Status Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-center">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block">
            Open (Awaiting Attention)
          </span>
          <span className="text-xl font-extrabold text-amber-900 dark:text-amber-100">{open}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-center">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase block">
            In Progress (Working)
          </span>
          <span className="text-xl font-extrabold text-indigo-900 dark:text-indigo-100">{inProgress}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-center">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">
            Resolved
          </span>
          <span className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100">{resolved}</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Inquiries by Category
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {Object.entries(byCategory).map(([catKey, count]) => (
            <div key={catKey} className="flex items-center justify-between py-1 border-b border-slate-200/40 dark:border-slate-700/40">
              <span className="text-slate-600 dark:text-slate-400">{categoryLabels[catKey] || catKey}</span>
              <span className="font-bold text-purple-700 dark:text-purple-300">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
        <span>Simplified Lifecycle: <strong className="text-slate-600 dark:text-slate-300">Open → In Progress → Resolved</strong></span>
        <span>Priority (P1: {byPriority.p1}, P2: {byPriority.p2}, P3: {byPriority.p3}, P4: {byPriority.p4})</span>
      </div>
    </Card>
  );
};

export default PlatformSupportAnalytics;
