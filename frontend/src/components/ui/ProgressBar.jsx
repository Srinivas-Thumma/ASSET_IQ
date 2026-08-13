import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn.js';

export const ProgressBar = ({
  value = 0,
  max = 100,
  showLabel = false,
  colorVariant = 'auto',
  className = '',
  height = 'h-2'
}) => {
  const numericValue = typeof value === 'number' ? value : 0;
  const numericMax = typeof max === 'number' && max > 0 ? max : 100;
  const percent = Math.min(100, Math.max(0, Math.round((numericValue / numericMax) * 100)));

  const getColorClass = () => {
    if (colorVariant === 'purple') return 'bg-[#6D28D9]';
    if (colorVariant === 'emerald') return 'bg-emerald-500';
    if (colorVariant === 'amber') return 'bg-amber-500';
    if (colorVariant === 'destructive' || colorVariant === 'red') return 'bg-red-500';

    // Auto threshold based on percentage
    if (percent > 80) return 'bg-[#6D28D9]';
    if (percent >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      <div className={cn('w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden', height)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', getColorClass())}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <span>{numericValue} / {numericMax}</span>
          <span>{percent}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
