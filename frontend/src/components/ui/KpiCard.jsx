import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const KpiCard = ({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  trend = [],
  className = '',
  onClick,
  isPositive = true,
  alertDot = false
}) => {
  // Generate smooth SVG points if trend array is passed
  const hasTrend = Array.isArray(trend) && trend.length > 1;
  const min = hasTrend ? Math.min(...trend) : 0;
  const max = hasTrend ? Math.max(...trend) : 100;
  const range = max - min || 1;

  const points = hasTrend
    ? trend
        .map((v, i) => {
          const x = (i / (trend.length - 1)) * 120;
          const y = 30 - ((v - min) / range) * 24;
          return `${x},${y}`;
        })
        .join(' ')
    : '';

  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { y: -2, transition: { duration: 0.15 } } : {}}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900',
        className
      )}
    >
      {/* Top row: Icon + optional alert dot */}
      <div className="flex items-center justify-between mb-3">
        {Icon && (
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300 flex items-center justify-center border border-purple-100 dark:border-purple-900/60 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        {alertDot && (
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
        )}
      </div>

      {/* Metric details */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          {title}
        </span>
        <div className="text-[28px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none py-0.5">
          {value}
        </div>
      </div>

      {/* Delta badge + Sparkline / Subtitle */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {delta !== undefined && delta !== null ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold',
                isPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              )}
              <span>{delta}</span>
            </span>
            {deltaLabel && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {deltaLabel}
              </span>
            )}
          </div>
        ) : deltaLabel ? (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {deltaLabel}
          </span>
        ) : <div />}

        {/* Sparkline */}
        {hasTrend && (
          <svg className="w-24 h-7 stroke-[#6D28D9] dark:stroke-purple-400 fill-none shrink-0" viewBox="0 0 120 32">
            <polyline
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        )}
      </div>
    </motion.div>
  );
};

export default KpiCard;
