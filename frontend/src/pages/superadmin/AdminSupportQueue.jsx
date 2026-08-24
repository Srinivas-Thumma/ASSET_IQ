import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LifeBuoy,
  MessageSquare,
  Building2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Tag
} from 'lucide-react';
import ticketApi from '../../api/ticket.api.js';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { formatDate, formatRelative } from '../../utils/formatters.js';

export const AdminSupportQueue = () => {
  const navigate = useNavigate();
  const [activeStatusTab, setActiveStatusTab] = useState('all'); // 'all' | 'open' | 'in_progress' | 'resolved'
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: () => ticketApi.getTickets({ type: 'admin_support' })
  });

  const categories = [
    { key: 'all', label: 'All Categories' },
    { key: 'billing', label: 'Billing & Subscriptions' },
    { key: 'plan_upgrade', label: 'Plan & Quotas' },
    { key: 'policy', label: 'Configuration & Access' },
    { key: 'technical', label: 'Technical Issues' },
    { key: 'other', label: 'General / Other' }
  ];

  const categoryLabels = {
    billing: 'Billing & Subscriptions',
    plan_upgrade: 'Plan & Quotas',
    policy: 'Configuration & Access',
    technical: 'Technical Issues',
    other: 'General / Other'
  };

  const filteredTickets = useMemo(() => {
    return (Array.isArray(tickets) ? tickets : []).filter((t) => {
      // 1. Status Filter
      if (activeStatusTab === 'open' && t.status !== 'open') return false;
      if (activeStatusTab === 'in_progress' && t.status !== 'in_progress' && t.status !== 'claimed') return false;
      if (activeStatusTab === 'resolved' && t.status !== 'resolved' && t.status !== 'closed') return false;

      // 2. Category Filter
      if (activeCategory !== 'all' && t.issueType !== activeCategory) return false;

      // 3. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        t.title?.toLowerCase().includes(q) ||
        t._id?.toLowerCase().includes(q) ||
        t.organizationName?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    });
  }, [tickets, activeStatusTab, activeCategory, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Platform Administration', to: '/admin/dashboard' },
          { label: 'Platform Support Requests' }
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight mb-1">
          Platform Support & Enterprise Requests
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dedicated support channel for Organization Administrators to request assistance, plan upgrades, and platform governance.
        </p>
      </div>

      {/* Simplified Filter Bar */}
      <Card className="p-4 space-y-3" hoverLift={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
            {[
              { key: 'all', label: 'All Cases', count: tickets.length },
              { key: 'open', label: 'Open', count: tickets.filter((t) => t.status === 'open').length },
              { key: 'in_progress', label: 'In Progress', count: tickets.filter((t) => ['claimed', 'in_progress'].includes(t.status)).length },
              { key: 'resolved', label: 'Resolved', count: tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveStatusTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeStatusTab === tab.key
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search + Category Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Category Dropdown */}
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject or organization..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      {isLoading ? (
        <Card className="p-6 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No platform support requests"
          description="There are currently no platform support cases matching the selected status or filters."
        />
      ) : (
        <Card className="p-0 overflow-hidden" hoverLift={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Case ID</th>
                  <th className="px-4 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Organization</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTickets.map((tkt) => {
                  const caseCode = `SUP-${tkt._id.slice(-6).toUpperCase()}`;

                  return (
                    <tr
                      key={tkt._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-purple-700 dark:text-purple-400">
                        {caseCode}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                        {tkt.title}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {tkt.organizationName || tkt.organizationId?.name || 'Tenant Org'}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                        {categoryLabels[tkt.issueType] || tkt.issueType || 'General'}
                      </td>

                      <td className="px-4 py-3.5 uppercase font-bold text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            tkt.priority === 'p1'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : tkt.priority === 'p2'
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {tkt.priority || 'p3'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            tkt.status === 'resolved'
                              ? 'emerald'
                              : tkt.status === 'closed'
                              ? 'slate'
                              : tkt.status === 'in_progress' || tkt.status === 'claimed'
                              ? 'orange'
                              : 'blue'
                          }
                          dot
                        >
                          {tkt.status === 'resolved'
                            ? 'Resolved'
                            : tkt.status === 'closed'
                            ? 'Closed'
                            : tkt.status === 'in_progress' || tkt.status === 'claimed'
                            ? 'In Progress'
                            : 'Open'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 text-xs">
                        {formatRelative(tkt.createdAt)}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={MessageSquare}
                          onClick={() => navigate(`/ticket/${tkt._id}`)}
                          className="h-8 text-xs text-purple-700 dark:text-purple-300"
                        >
                          Open Case
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSupportQueue;
