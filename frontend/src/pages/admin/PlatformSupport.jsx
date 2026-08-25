import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Tag
} from 'lucide-react';
import ticketApi from '../../api/ticket.api.js';
import { requestApi } from '../../api/request.api.js';
import { conversationApi } from '../../api/conversation.api.js';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ContactPlatformSupportModal from '../../components/modals/ContactPlatformSupportModal.jsx';
import { formatDate, formatRelative } from '../../utils/formatters.js';
import { toast } from 'sonner';

export const PlatformSupport = () => {
  const navigate = useNavigate();
  const [activeStatusTab, setActiveStatusTab] = useState('all'); // 'all' | 'open' | 'in_progress' | 'resolved'
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isOpeningOrgChannel, setIsOpeningOrgChannel] = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['platform-support-requests'],
    queryFn: async () => {
      const [requestsRes, ticketsRes] = await Promise.allSettled([
        requestApi.getRequests(),
        ticketApi.getTickets({ type: 'admin_support' })
      ]);

      const requestsList = requestsRes.status === 'fulfilled'
        ? (Array.isArray(requestsRes.value) ? requestsRes.value : requestsRes.value?.items || [])
        : [];

      const ticketsList = ticketsRes.status === 'fulfilled'
        ? (Array.isArray(ticketsRes.value) ? ticketsRes.value : ticketsRes.value?.items || [])
        : [];

      const combined = [...requestsList];
      const existingIds = new Set(requestsList.map((r) => String(r._id)));

      for (const t of ticketsList) {
        if (!existingIds.has(String(t._id))) {
          combined.push({
            ...t,
            requestCode: t.ticketCode || t.ticketNumber || `TKT-${t._id.toString().slice(-6).toUpperCase()}`,
            category: t.issueType || 'platform_support'
          });
        }
      }

      return combined.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
    }
  });

  const handleOpenOrgChannel = async () => {
    setIsOpeningOrgChannel(true);
    try {
      const conv = await conversationApi.getOrganizationConversation();
      if (conv?._id) {
        navigate(`/conversations/${conv._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open organization support channel');
    } finally {
      setIsOpeningOrgChannel(false);
    }
  };

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
        t.description?.toLowerCase().includes(q) ||
        t._id?.toLowerCase().includes(q)
      );
    });
  }, [tickets, activeStatusTab, activeCategory, searchQuery]);

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
            Formal communication channel with AssetOwl Platform Administration for account, billing, and system assistance.
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
            {[
              { key: 'all', label: 'All Requests', count: tickets.length },
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

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by subject or keywords..."
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
          title="No platform support cases"
          description="Your organization has no support requests matching the selected filters."
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
                  <th className="px-5 py-3.5 text-right">Action</th>
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
                            tkt.status === 'resolved' || tkt.status === 'closed'
                              ? 'resolved'
                              : tkt.status === 'in_progress' || tkt.status === 'claimed'
                              ? 'indigo'
                              : 'warning'
                          }
                          dot
                        >
                          {tkt.status === 'resolved' || tkt.status === 'closed'
                            ? 'Resolved'
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

      {/* Contact Platform Support Modal */}
      <ContactPlatformSupportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
};

export default PlatformSupport;
