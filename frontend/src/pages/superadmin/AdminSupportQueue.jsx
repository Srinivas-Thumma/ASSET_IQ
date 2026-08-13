import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LifeBuoy,
  MessageSquare,
  Building2,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Ticket
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
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: () => ticketApi.getTickets({ type: 'admin_support' })
  });

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const isCategoryMatch =
        activeCategory === 'all' ||
        t.issueType === activeCategory ||
        t.type === activeCategory;

      const q = searchQuery.toLowerCase();
      const isSearchMatch =
        !searchQuery.trim() ||
        t.title?.toLowerCase().includes(q) ||
        t.ticketCode?.toLowerCase().includes(q) ||
        t.organizationName?.toLowerCase().includes(q);

      return isCategoryMatch && isSearchMatch;
    });
  }, [tickets, activeCategory, searchQuery]);

  const categories = [
    { key: 'all', label: 'All Requests' },
    { key: 'billing', label: 'Billing & Invoices' },
    { key: 'plan_upgrade', label: 'Plan Upgrades' },
    { key: 'policy', label: 'Policy & Compliance' },
    { key: 'technical', label: 'Technical Issue' },
    { key: 'other', label: 'General / Other' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Platform', to: '/admin/dashboard' },
          { label: 'Admin Support Requests' }
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Admin Support & Enterprise Requests
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Direct escalation queue and operational support tickets raised by Organization Administrators and Asset Managers.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-4 space-y-3" hoverLift={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.key
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket title, tenant..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Card className="p-6 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No Admin Requests in Queue"
          description="There are currently no active administrative support tickets matching the selected filters."
        />
      ) : (
        <Card className="p-0 overflow-hidden" hoverLift={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Ticket ID</th>
                  <th className="px-4 py-3.5">Request Summary</th>
                  <th className="px-4 py-3.5">Tenant Organization</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTickets.map((tkt) => (
                  <tr
                    key={tkt._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-[#6D28D9] dark:text-purple-400">
                      {tkt.ticketCode || `TKT-${tkt._id.slice(-4)}`}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {tkt.title}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {tkt.organizationName || 'Tenant Org'}
                    </td>

                    <td className="px-4 py-3.5 capitalize text-slate-500">
                      {tkt.issueType?.replace('_', ' ') || 'Support'}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          tkt.status === 'resolved' || tkt.status === 'closed'
                            ? 'resolved'
                            : tkt.status === 'claimed' || tkt.status === 'in_progress'
                            ? 'pending'
                            : 'active'
                        }
                        dot
                      >
                        {tkt.status}
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
                        className="h-8 text-xs text-[#6D28D9] dark:text-purple-300"
                      >
                        View Discussion
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSupportQueue;
