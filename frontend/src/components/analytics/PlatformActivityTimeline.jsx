import React, { useState } from 'react';
import {
  Activity,
  Building2,
  Clock,
  User,
  HardDrive,
  Ticket,
  Lock,
  Zap,
  Filter
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import { formatRelative } from '../../utils/formatters.js';

export const PlatformActivityTimeline = ({ activities = [] }) => {
  const [activeTab, setActiveTab] = useState('all');

  if (activities.length === 0) {
    return (
      <Card hoverLift className="p-6 text-center text-slate-400">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <CardTitle>Recent Platform Activity</CardTitle>
        <p className="text-xs text-slate-500 mt-1">No platform activity recorded in the telemetry log yet.</p>
      </Card>
    );
  }

  const filteredActivities = activities.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'security') return item.action.includes('user_') || item.action.includes('role') || item.targetType === 'user';
    if (activeTab === 'tickets') return item.targetType === 'ticket' || item.action.includes('ticket');
    if (activeTab === 'assets') return item.targetType === 'asset' || item.action.includes('asset');
    if (activeTab === 'tenants') return item.targetType === 'organization' || item.action.includes('org');
    if (activeTab === 'admin') return item.actorRole === 'super_admin';
    return true;
  });

  const getActionIcon = (targetType, action = '') => {
    if (action.includes('user') || action.includes('role')) return Lock;
    switch (targetType) {
      case 'asset':
        return HardDrive;
      case 'ticket':
        return Ticket;
      case 'user':
        return User;
      case 'organization':
        return Building2;
      default:
        return Zap;
    }
  };

  const tabs = [
    { id: 'all', label: 'All Telemetry' },
    { id: 'security', label: 'Security' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'assets', label: 'Assets' },
    { id: 'tenants', label: 'Tenants' },
    { id: 'admin', label: 'SuperAdmin' }
  ];

  return (
    <Card hoverLift className="space-y-4">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <CardTitle>Recent Platform Activity & Telemetry Stream</CardTitle>
            <CardDescription>Grouped timeline of administrative actions, hardware operations, and security logs</CardDescription>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      {filteredActivities.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No events match the selected "{activeTab}" telemetry filter.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredActivities.map((item) => {
            const Icon = getActionIcon(item.targetType, item.action);

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
                        {item.displayLabel || item.actionLabel}
                      </span>
                      {item.count > 1 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          x{item.count}
                        </span>
                      )}
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
      )}
    </Card>
  );
};

export default PlatformActivityTimeline;
