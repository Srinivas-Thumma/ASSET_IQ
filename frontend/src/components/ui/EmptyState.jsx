import React from 'react';
import { Layers, Plus } from 'lucide-react';
import Button from './Button.jsx';

export const EmptyState = ({
  icon: Icon = Layers,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  className = ''
}) => {
  return (
    <div
      className={`p-10 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 shadow-sm border border-purple-100 dark:border-purple-900/40">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          variant="primary"
          icon={ActionIcon}
          onClick={onAction}
          className="text-xs shadow-md shadow-purple-600/20"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
