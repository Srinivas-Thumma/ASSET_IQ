import React from 'react';
import {
  Lock,
  ShieldAlert,
  UserCheck,
  UserX,
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import { formatRelative } from '../../utils/formatters.js';

export const SecurityAndRiskCard = ({ security = {} }) => {
  const events = security.recentEvents || [];

  return (
    <Card hoverLift className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Security & Platform Risk Telemetry</CardTitle>
            <CardDescription>Audited administrative privilege changes, credential events, and account suspensions</CardDescription>
          </div>
        </div>
        <Badge variant={security.suspendedOrgs > 0 ? 'warning' : 'purple'}>
          {security.totalSecurityEvents || 0} Security Events
        </Badge>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Security Events</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white">{security.totalSecurityEvents || 0}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Inactive Accounts</span>
          <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{security.suspendedUsers || 0}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Suspended Orgs</span>
          <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{security.suspendedOrgs || 0}</span>
        </div>
      </div>

      {/* Recent Security Log Stream */}
      {events.length > 0 && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Recent Security Actions
          </span>
          <div className="space-y-1.5 text-xs">
            {events.slice(0, 3).map((e) => (
              <div key={e._id} className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-slate-700/40 last:border-0">
                <span className="text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-200">{e.actor}</strong>: {e.action.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{formatRelative(e.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SecurityAndRiskCard;
