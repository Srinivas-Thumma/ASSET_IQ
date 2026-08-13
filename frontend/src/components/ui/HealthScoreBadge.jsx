import React from 'react';
import { Activity, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

export const HealthScoreBadge = ({
  score = 92,
  showLabel = true,
  size = 'md',
  className = ''
}) => {
  const numericScore = Math.max(0, Math.min(100, Math.round(score ?? 92)));

  // Color coding:
  // 81–100: Green badge bg-green-50 text-green-700 — "Optimal"
  // 61–80: Amber badge bg-amber-50 text-amber-700 — "Fair"
  // 41–60: Orange badge bg-orange-50 text-orange-700 — "Degraded"
  // 0–40: Red badge bg-red-50 text-red-700 — "Critical"
  let tier = {
    label: 'Optimal',
    badgeClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800',
    dotClass: 'bg-green-500',
    icon: ShieldCheck
  };

  if (numericScore < 41) {
    tier = {
      label: 'Critical',
      badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
      dotClass: 'bg-red-500',
      icon: AlertCircle
    };
  } else if (numericScore < 61) {
    tier = {
      label: 'Degraded',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
      dotClass: 'bg-orange-500',
      icon: AlertTriangle
    };
  } else if (numericScore < 81) {
    tier = {
      label: 'Fair',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500',
      icon: Activity
    };
  }

  const Icon = tier.icon;

  if (size === 'lg') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {numericScore}
          </span>
          <span className="text-sm font-bold text-slate-400">/ 100</span>
        </div>
        {showLabel && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${tier.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tier.dotClass}`} />
            {tier.label}
          </span>
        )}
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border select-none ${tier.badgeClass} ${className}`}
      >
        <span className="font-bold">{numericScore}</span>
        <span className="text-slate-400 text-[9px]">/ 100</span>
        {showLabel && <span>• {tier.label}</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border select-none ${tier.badgeClass} ${className}`}
    >
      <span className="font-bold">{numericScore}</span>
      <span className="opacity-60 text-[10px]">/ 100</span>
      {showLabel && <span>• {tier.label}</span>}
    </span>
  );
};

export default HealthScoreBadge;
