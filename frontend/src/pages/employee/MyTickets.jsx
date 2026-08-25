import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  Laptop,
  MessageSquare,
  Ticket as TicketIcon
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import RaiseTicketModal from '../../components/modals/RaiseTicketModal.jsx';
import { useTickets } from '../../hooks/useTickets.js';
import { useAssets } from '../../hooks/useAssets.js';
import { formatDate, formatRelative } from '../../utils/formatters.js';

export const MyTickets = () => {
  const navigate = useNavigate();
  const { myTickets, isMyTicketsLoading } = useTickets();
  const { myAssets } = useAssets();

  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'open' | 'in_progress' | 'resolved' | 'closed'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    if (!myTickets) return [];
    if (filterStatus === 'all') return myTickets;
    if (filterStatus === 'open') return myTickets.filter((t) => t.status === 'open' || t.status === 'claimed');
    return myTickets.filter((t) => t.status === filterStatus);
  }, [myTickets, filterStatus]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const total = myTickets?.length || 0;
    const open = myTickets?.filter((t) => t.status === 'open' || t.status === 'claimed').length || 0;
    const inProgress = myTickets?.filter((t) => t.status === 'in_progress').length || 0;
    const resolved = myTickets?.filter((t) => t.status === 'resolved' || t.status === 'closed').length || 0;
    return { total, open, inProgress, resolved };
  }, [myTickets]);

  const getPriorityBadge = (p) => {
    if (!p) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Pending Triage
        </span>
      );
    }
    switch (p?.toLowerCase()) {
      case 'p1':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">P1 Critical</span>;
      case 'p2':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">P2 High</span>;
      case 'p3':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">P3 Medium</span>;
      case 'p4':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">P4 Low</span>;
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Pending Triage
          </span>
        );
    }
  };

  const getStatusBadge = (s) => {
    switch (s?.toLowerCase()) {
      case 'open':
      case 'claimed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Open</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">In Progress</span>;
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Resolved</span>;
      case 'closed':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Closed</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header + "Raise Ticket" button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
            My Support & Service Tickets
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
            Track real-time diagnostics, hardware replacements, and direct discussions with IT support specialists.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="shadow-sm shadow-purple-600/20"
        >
          Raise Ticket
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Tickets', count: counts.total },
          { key: 'open', label: 'Open', count: counts.open },
          { key: 'in_progress', label: 'In Progress', count: counts.inProgress },
          { key: 'resolved', label: 'Resolved / Closed', count: counts.resolved }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              filterStatus === tab.key
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                filterStatus === tab.key
                  ? 'bg-purple-700/80 text-purple-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {isMyTicketsLoading ? (
        <div className="space-y-3">
          <Skeleton variant="rectangular" className="h-28 rounded-2xl" />
          <Skeleton variant="rectangular" className="h-28 rounded-2xl" />
          <Skeleton variant="rectangular" className="h-28 rounded-2xl" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title={filterStatus === 'all' ? 'No tickets yet' : `No ${filterStatus.replace('_', ' ')} tickets`}
          description={
            filterStatus === 'all'
              ? "You're all caught up! If something breaks or you need equipment assistance, raise your first ticket."
              : `There are currently no tickets matching the "${filterStatus}" status filter.`
          }
          actionLabel="Raise Ticket"
          actionIcon={Plus}
          onAction={() => setIsModalOpen(true)}
          className="mt-6"
        />
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const ticketCode = ticket.ticketNumber || ticket.ticketCode || (ticket._id ? `TKT-${ticket._id.slice(-6).toUpperCase()}` : 'TKT');
            const relatedAssetName = ticket.assetId?.name || (typeof ticket.assetId === 'string' ? 'Assigned Hardware' : null);

            return (
              <div
                key={ticket._id}
                onClick={() => navigate(`/ticket/${ticket._id}`)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-purple-300 dark:hover:border-purple-700/70 hover:shadow-md hover:shadow-purple-500/5 transition-all cursor-pointer space-y-3 group"
              >
                {/* Top Row: Ticket Code, Title, Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-2.5 py-1 rounded-xl border border-purple-200/80 dark:border-purple-800">
                      {ticketCode}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {ticket.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>

                {/* Description snippet */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {ticket.description}
                </p>

                {/* Bottom Metadata */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-4 flex-wrap">
                    {relatedAssetName && (
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700 text-[11px]">
                        <Laptop className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>{relatedAssetName}</span>
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Opened {formatRelative(ticket.createdAt)}</span>
                    </span>
                  </div>

                  <div className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform text-xs">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Discussion</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Raise Ticket Modal */}
      <RaiseTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userAssets={myAssets}
      />
    </div>
  );
};

export default MyTickets;
