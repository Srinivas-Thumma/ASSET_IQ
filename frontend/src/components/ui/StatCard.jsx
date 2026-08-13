import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'indigo',
  subtext,
  actionText,
  onAction,
  actionLink,
  className = ''
}) => {
  const navigate = useNavigate();
  const isPositive = typeof change === 'string' && (change.startsWith('+') || change.includes('YoY') || !change.startsWith('-'));

  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80',
      action: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'
    },
    rose: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/80',
      action: 'text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300'
    },
    amber: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80',
      action: 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300'
    },
    orange: {
      iconBg: 'bg-orange-50 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/80',
      action: 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300'
    },
    emerald: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80',
      action: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300'
    },
    purple: {
      iconBg: 'bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/80',
      action: 'text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300'
    },
    slate: {
      iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
      action: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
    }
  };

  const currentStyle = colorStyles[color] || colorStyles.indigo;

  const handleAction = () => {
    if (onAction) onAction();
    else if (actionLink) navigate(actionLink);
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900/90 rounded-3xl border border-purple-100/90 dark:border-purple-900/40 p-5 shadow-xl shadow-purple-500/5 dark:shadow-purple-950/30 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 ${className}`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-purple-300/70 uppercase tracking-wider">
            {title}
          </span>
          {Icon && (
            <div className={`p-2.5 rounded-2xl ${currentStyle.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </span>
          {change && (
            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md ${
                isPositive
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60'
                  : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {change}
            </span>
          )}
        </div>

        {subtext && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">{subtext}</p>
        )}
      </div>

      {actionText && (
        <div className="mt-4 pt-3 border-t border-purple-50 dark:border-purple-900/30 flex items-center justify-end">
          <button
            type="button"
            onClick={handleAction}
            className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${currentStyle.action}`}
          >
            <span>{actionText}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default StatCard;
