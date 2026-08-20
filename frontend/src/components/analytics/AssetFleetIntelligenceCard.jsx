import React from 'react';
import {
  HardDrive,
  Activity,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Layers,
  Wrench
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';

export const AssetFleetIntelligenceCard = ({ data = {} }) => {
  const totalAssets = data.totalAssets || 0;
  const healthBands = data.healthBands || { healthy: 0, warning: 0, critical: 0 };
  const byStatus = data.byStatus || { stock: 0, assigned: 0, repair: 0, retired: 0 };
  const lifecycle = data.lifecycle || { newAssets: 0, agingAssets: 0, approachingRetirement: 0, replacementRecommendations: {} };
  const aiInsights = data.aiInsights || [];
  const categories = data.byCategory || [];

  if (totalAssets === 0) {
    return (
      <Card hoverLift className="p-6 text-center text-slate-400">
        <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <CardTitle>Asset Fleet Intelligence</CardTitle>
        <p className="text-xs text-slate-500 mt-1">No hardware assets registered on the platform yet.</p>
      </Card>
    );
  }

  const healthyPct = Math.round((healthBands.healthy / totalAssets) * 100) || 0;
  const warningPct = Math.round((healthBands.warning / totalAssets) * 100) || 0;
  const criticalPct = Math.round((healthBands.critical / totalAssets) * 100) || 0;

  return (
    <Card hoverLift className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Asset Fleet & AI Health Intelligence</CardTitle>
            <CardDescription>Global fleet condition, AI diagnostics, and lifecycle wear</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="purple">
            {totalAssets} Total Assets
          </Badge>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Avg Health: {data.avgFleetHealth || 90}/100
          </span>
        </div>
      </div>

      {/* Fleet Status & Health Distribution Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
            Fleet Deployment Status
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">{byStatus.assigned}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">In Stock</span>
              <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{byStatus.stock}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Repair</span>
              <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{byStatus.repair}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Retired</span>
              <span className="text-lg font-extrabold text-slate-500">{byStatus.retired}</span>
            </div>
          </div>

          {/* Segmented Distribution Bar */}
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Health Spectrum</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {healthyPct}% Healthy • {warningPct}% Warning • {criticalPct}% Critical
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div style={{ width: `${healthyPct}%` }} className="bg-emerald-500 h-full" title={`Healthy: ${healthBands.healthy}`} />
              <div style={{ width: `${warningPct}%` }} className="bg-amber-500 h-full" title={`Warning: ${healthBands.warning}`} />
              <div style={{ width: `${criticalPct}%` }} className="bg-rose-500 h-full" title={`Critical: ${healthBands.critical}`} />
            </div>
          </div>
        </div>

        {/* Lifecycle & Replacement */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
            Lifecycle & Replacement Forecast
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wider">New (&lt; 6 mo)</span>
              <span className="text-xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{lifecycle.newAssets || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 block uppercase tracking-wider">Mid-Life</span>
              <span className="text-xl font-black text-amber-900 dark:text-amber-100 mt-1">{lifecycle.agingAssets || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 block uppercase tracking-wider">End-of-Life</span>
              <span className="text-xl font-black text-rose-900 dark:text-rose-100 mt-1">{lifecycle.approachingRetirement || 0}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">AI Recommendations:</span>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                {lifecycle.replacementRecommendations?.keep || 0} Keep
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                {lifecycle.replacementRecommendations?.repair || 0} Repair
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                {lifecycle.replacementRecommendations?.replace || 0} Replace
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Data-Driven AI Insights Observations */}
      <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Fleet AI Insights & Observations</span>
        </div>
        <ul className="space-y-1 pl-5 list-disc text-xs text-purple-950 dark:text-purple-200/90 leading-relaxed">
          {aiInsights.map((insight, i) => (
            <li key={i}>{insight}</li>
          ))}
        </ul>
      </div>

      {/* Category Breakdown Chips */}
      {categories.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Category Breakdown
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <span>{cat.name}</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">({cat.count})</span>
                <span className="text-[10px] text-slate-400">{cat.avgHealth}% health</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AssetFleetIntelligenceCard;
