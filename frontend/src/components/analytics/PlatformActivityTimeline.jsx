import React from 'react';
import {
  Activity,
  Building2,
  Clock,
  User,
  HardDrive,
  Ticket,
  CheckCircle2,
  ShieldAlert,
  Zap
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import { formatRelative, formatDate } from '../../utils/formatters.js';

export const PlatformActivityTimeline = ({ activities = [] }) => {
  if (activities.length === 0) {
    return (
      <Card hoverLift className="p-6 text-center text-slate-400">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <CardTitle>Recent Platform Activity</CardTitle>
        <p className="text-xs text-slate-500 mt-1">No platform activity recorded in the telemetry log yet.</p>
      </Card>
    );
  }

  const getActionIcon = (targetType) => {
    switch (targetType) {
      case 'asset':
        return HardDrive;
      case 'ticket':
        return Ticket;
      case 'user':
        return User;
      default:
        return Zap;
    }
  };

  return (
    <Card hoverLift className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <CardTitle>Recent Platform Activity & Telemetry</CardTitle>
            <CardDescription>Audited timeline of administrative changes, hardware operations, and support cases</CardDescription>
          </div>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Last {activities.length} Events
        </span>
      </div>

      {/* Timeline List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {activities.map((item) => {
          const Icon = getActionIcon(item.targetType);

          return (
            <div key={item._id} className="py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 border border-purple-100 dark:border-purple-900/60">
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.organizationName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.actionLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>by <strong className="text-slate-600 dark:text-slate-300">{item.actor}</strong> ({item.actorRole})</span>
                    {item.metadata?.title && (
                      <>
                        <span>•</span>
                        <span className="truncate italic">"{item.metadata.title}"</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                {formatRelative(item.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default PlatformActivityTimeline;
