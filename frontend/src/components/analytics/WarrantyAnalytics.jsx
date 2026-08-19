import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';

export const WarrantyAnalytics = ({ data = {} }) => {
  const total = data.totalWarranties || 0;
  const active = data.activeCount || 0;
  const expired = data.expiredCount || 0;
  const coveragePercent = data.coveragePercent || 0;
  const forecast = data.forecast || { expiring30Days: 0, expiring60Days: 0, expiring90Days: 0 };

  if (total === 0) {
    return (
      <Card hoverLift className="p-6 text-center text-slate-400">
        <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <CardTitle>Warranty & Coverage Intelligence</CardTitle>
        <p className="text-xs text-slate-500 mt-1">No warranty contracts registered on the platform.</p>
      </Card>
    );
  }

  return (
    <Card hoverLift className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Warranty Coverage & Expiration Forecast</CardTitle>
            <CardDescription>Enterprise OEM warranty coverage and upcoming renewal horizons</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="indigo">{total} Policies</Badge>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {coveragePercent}% Fleet Protected
          </span>
        </div>
      </div>

      {/* Coverage Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Coverage</span>
          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{active}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Expired</span>
          <span className="text-lg font-extrabold text-slate-400">{expired}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Expiring (30d)</span>
          <span className="text-lg font-extrabold text-amber-900 dark:text-amber-100">{forecast.expiring30Days}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 text-center">
          <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">Expiring (60-90d)</span>
          <span className="text-lg font-extrabold text-purple-900 dark:text-purple-100">{forecast.expiring60Days + forecast.expiring90Days}</span>
        </div>
      </div>

      {/* Expiration Forecast Horizon Bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Upcoming Renewal Timeline
        </span>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold text-amber-600 block">Next 30 Days</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">{forecast.expiring30Days}</span>
            <span className="text-[10px] text-slate-400 block">Urgent Action</span>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold text-indigo-600 block">31 - 60 Days</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">{forecast.expiring60Days}</span>
            <span className="text-[10px] text-slate-400 block">Plan Renewal</span>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold text-purple-600 block">61 - 90 Days</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">{forecast.expiring90Days}</span>
            <span className="text-[10px] text-slate-400 block">Budget Review</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WarrantyAnalytics;
