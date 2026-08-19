import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  ExternalLink
} from 'lucide-react';
import ticketApi from '../../api/ticket.api.js';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ContactPlatformSupportModal from '../../components/modals/ContactPlatformSupportModal.jsx';
import { formatDate, formatRelative } from '../../utils/formatters.js';

export const PlatformSupport = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'all' | 'active' | 'resolved'
  const [searchQuery, setSearchQuery] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['platform-support-tickets'],
    queryFn: () => ticketApi.getTickets({ type: 'admin_support' })
  });

  const categoryLabels = {
    billing: 'Billing & Subscriptions',
    plan_upgrade: 'Plan & Quotas',
    policy: 'Configuration & Access',
    technical: 'Technical Bug',
    other: 'General Inquiry'
  };

  const filteredTickets = useMemo(() => {
    return (Array.isArray(tickets) ? tickets : []).filter((t) => {
      const isResolved = t.status === 'resolved' || t.status === 'closed';
      if (activeTab === 'active' && isResolved) return false;
      if (activeTab === 'resolved' && !isResolved) return false;

      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t._id?.toLowerCase().includes(q)
      );
    });
  }, [tickets, activeTab, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Governance', to: '/dashboard' },
          { label: 'Platform Support' }
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight mb-1">
            Platform Support & Escalations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Direct, audited communication channel between your organization and AssetOwl Platform Administration.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsContactModalOpen(true)}
          className="self-start sm:self-auto text-xs"
        >
          Contact Platform Support
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-4 space-y-3" hoverLift={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active Cases
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'resolved'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Resolved History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Requests ({tickets.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by case title or keywords..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
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
          title={
            activeTab === 'active'
              ? 'No active platform support cases'
              : 'No support requests found'
          }
          description={
            activeTab === 'active'
              ? 'Your organization has no open cases with AssetOwl Platform Administration.'
              : 'No platform support requests matched the selected filter.'
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden" hoverLift={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Case ID</th>
                  <th className="px-4 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Discussion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTickets.map((tkt) => {
                  const caseId = `SUP-${tkt._id.slice(-6).toUpperCase()}`;
                  return (
                    <tr
                      key={tkt._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-purple-700 dark:text-purple-400">
                        {caseId}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                        {tkt.title}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
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
                            tkt.status === 'resolved' || tkt.status === 'closed'
                              ? 'resolved'
                              : tkt.status === 'in_progress' || tkt.status === 'claimed'
                              ? 'indigo'
                              : 'warning'
                          }
                          dot
                        >
                          {tkt.status === 'in_progress' ? 'In Progress' : tkt.status === 'claimed' ? 'Assigned' : tkt.status}
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
                          View Discussion
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

      {/* Contact Platform Support Modal */}
      <ContactPlatformSupportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
};

export default PlatformSupport;
