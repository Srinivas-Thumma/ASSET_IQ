import React from 'react';
import {
  Activity,
  Laptop,
  Ticket,
  User,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { formatRelative } from '../utils/formatters.js';

export const ActivityFeed = ({
  events = [],
  title = 'Live Activity Stream',
  maxItems = 10,
  className = ''
}) => {
  const displayedEvents = events.slice(0, maxItems);

  const getActionIcon = (action = '', targetType = '') => {
    const act = action.toLowerCase();
    if (act.includes('ticket')) return { icon: Ticket, bg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400' };
    if (act.includes('asset') || act.includes('hardware')) return { icon: Laptop, bg: 'bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400' };
    if (act.includes('user') || act.includes('personnel') || act.includes('employee')) return { icon: User, bg: 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400' };
    return { icon: Activity, bg: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400' };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Real-time Stream</span>
        </div>
      )}

      {displayedEvents.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No recent activity logged.
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9] dark:divide-slate-800/80">
          {displayedEvents.map((item, idx) => {
            const { icon: ItemIcon, bg } = getActionIcon(item.action, item.targetType);
            return (
              <div key={item.id || item._id || idx} className="py-3 flex items-start gap-3 text-xs">
                {/* 32px circular icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                  <ItemIcon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1E293B] dark:text-white truncate">
                      {item.actor || 'System'}
                    </p>
                    <span className="text-xs text-[#94A3B8] shrink-0">
                      {formatRelative(item.createdAt || item.timestamp || new Date())}
                    </span>
                  </div>

                  <p className="text-xs text-[#475569] dark:text-slate-300 mt-0.5 leading-relaxed">
                    {item.action} {item.targetName ? `• ${item.targetName}` : ''}
                  </p>

                  {item.orgName && (
                    <span className="inline-block mt-1 text-[10px] font-mono font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded">
                      {item.orgName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
