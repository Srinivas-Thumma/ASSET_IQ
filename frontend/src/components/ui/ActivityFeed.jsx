import React from 'react';
import {
  Activity,
  ShieldCheck,
  Laptop,
  Ticket,
  User,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { formatRelative } from '../../utils/formatters.js';
import Card, { CardTitle, CardDescription } from './Card.jsx';
import Badge from './Badge.jsx';

export const ActivityFeed = ({
  events = [],
  title = 'Recent Operational Activity',
  description = 'Audit trail and system event stream',
  maxItems = 5,
  className = ''
}) => {
  const getEventIcon = (targetType, action = '') => {
    if (action.includes('ticket') || targetType === 'ticket') return Ticket;
    if (action.includes('asset') || targetType === 'asset') return Laptop;
    if (action.includes('user') || targetType === 'user') return User;
    if (action.includes('retirement')) return Trash2;
    if (action.includes('procurement')) return ShoppingCart;
    return ShieldCheck;
  };

  const displayEvents = events.slice(0, maxItems);

  return (
    <Card className={className} hoverLift={false}>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#6D28D9]" />
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        <Badge variant="secondary">Live Log</Badge>
      </div>

      <div className="space-y-2.5">
        {displayEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-400 opacity-40" />
            No recent activity recorded
          </div>
        ) : (
          displayEvents.map((evt, idx) => {
            const Icon = getEventIcon(evt.targetType, evt.action);
            return (
              <div
                key={evt.id || idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3 text-xs"
              >
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#6D28D9] dark:text-purple-300 shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                      {evt.actor || 'System'}
                    </span>
                    <span className="text-slate-400">{formatRelative(evt.createdAt)}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 capitalize">
                    {evt.action} {evt.targetName ? `— ${evt.targetName}` : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default ActivityFeed;
