import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  Inbox,
  UserCheck,
  ArrowRight,
  Clock,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  History,
  Timer
} from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useAuthStore } from '../../stores/auth.store.js';
import { useTickets } from '../../hooks/useTickets.js';
import { formatDate, formatRelative } from '../../utils/formatters.js';

export const getSLAInfo = (ticket) => {
  const slaHoursMap = {
    p1: 2,
    p2: 8,
    p3: 24,
    p4: 72
  };
  const hours = slaHoursMap[ticket.priority?.toLowerCase()] || (ticket.priority ? 24 : 0);
  if (!hours) {
    return {
      hasSLA: false,
      timeString: 'Pending Triage',
      color: 'slate',
      isBreached: false,
      diffMs: 0
    };
  }

  const created = new Date(ticket.createdAt).getTime();
  const deadline = created + hours * 60 * 60 * 1000;
  const now = Date.now();
  const diffMs = deadline - now;
  const isBreached = diffMs <= 0;
  const totalMs = hours * 60 * 60 * 1000;
  const percentRemaining = Math.max(0, Math.min(100, (diffMs / totalMs) * 100));

  const absDiff = Math.abs(diffMs);
  const diffHours = Math.floor(absDiff / (1000 * 60 * 60));
  const diffMins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  let timeString = '';
  if (isBreached) {
    timeString = `Breached by ${diffHours > 0 ? `${diffHours}h ` : ''}${diffMins}m`;
  } else {
    timeString = `${diffHours > 0 ? `${diffHours}h ` : ''}${diffMins}m left`;
  }

  let color = 'green';
  if (isBreached || diffMs < 1 * 60 * 60 * 1000) {
    color = 'red';
  } else if (percentRemaining < 50 || diffMs < 4 * 60 * 60 * 1000) {
    color = 'amber';
  }

  return {
    hasSLA: true,
    isBreached,
    diffMs,
    timeString,
    percentRemaining,
    color,
    deadline: new Date(deadline)
  };
};

export const TicketQueue = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (user?.role === 'super_admin') {
    return <Navigate to="/admin/support" replace />;
  }

  const { tickets, isLoading, claimTicket } = useTickets();

  const [selectedTicketForClaim, setSelectedTicketForClaim] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState('p2');
  const [isClaiming, setIsClaiming] = useState(false);
  const [showBreachHistory, setShowBreachHistory] = useState(false);

  const openTbodyRef = useRef(null);
  const claimedTbodyRef = useRef(null);

  // Categorize tickets
  const openTickets = useMemo(() => {
    return tickets.filter((t) => t.status === 'open');
  }, [tickets]);

  const myClaimedTickets = useMemo(() => {
    return tickets.filter((t) => t.status === 'claimed' || t.status === 'in_progress');
  }, [tickets]);

  // GSAP Stagger for Open Tickets Table
  useEffect(() => {
    if (!openTbodyRef.current) return;
    const rows = openTbodyRef.current.querySelectorAll('tr');
    if (!rows || rows.length === 0) return;

    gsap.killTweensOf(rows);
    gsap.fromTo(
      rows,
      { y: 12, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.3,
        stagger: 0.03,
        ease: 'power2.out',
        clearProps: 'all'
      }
    );

    return () => {
      gsap.killTweensOf(rows);
      gsap.set(rows, { opacity: 1, y: 0, clearProps: 'all' });
    };
  }, [openTickets]);

  // GSAP Stagger for Claimed Tickets Table
  useEffect(() => {
    if (!claimedTbodyRef.current) return;
    const rows = claimedTbodyRef.current.querySelectorAll('tr');
    if (!rows || rows.length === 0) return;

    gsap.killTweensOf(rows);
    gsap.fromTo(
      rows,
      { y: 12, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.3,
        stagger: 0.03,
        ease: 'power2.out',
        clearProps: 'all'
      }
    );

    return () => {
      gsap.killTweensOf(rows);
      gsap.set(rows, { opacity: 1, y: 0, clearProps: 'all' });
    };
  }, [myClaimedTickets]);

  // SLA At Risk tickets (amber or red active tickets, sorted by urgency)
  const slaAtRiskTickets = useMemo(() => {
    return myClaimedTickets
      .map((tkt) => ({ tkt, sla: getSLAInfo(tkt) }))
      .filter(({ sla }) => sla.hasSLA && (sla.color === 'red' || sla.color === 'amber'))
      .sort((a, b) => a.sla.diffMs - b.sla.diffMs)
      .map(({ tkt }) => tkt);
  }, [myClaimedTickets]);

  // Past 7 Days Breached Tickets
  const pastBreachedTickets = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return tickets.filter((tkt) => {
      const sla = getSLAInfo(tkt);
      const isPast7Days = new Date(tkt.createdAt).getTime() > sevenDaysAgo;
      return isPast7Days && sla.isBreached;
    });
  }, [tickets]);

  const handleConfirmClaim = async () => {
    if (!selectedTicketForClaim) return;
    setIsClaiming(true);
    try {
      await claimTicket({
        id: selectedTicketForClaim._id,
        priority: selectedPriority
      });
      setSelectedTicketForClaim(null);
      navigate(`/tickets/${selectedTicketForClaim._id}`);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
            Ticket Operations Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Triage incoming service requests, monitor live SLA countdowns, and manage your technical workbench.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: SLA AT RISK (Urgent Alert Cards)
      ────────────────────────────────────────────────────────────── */}
      {slaAtRiskTickets.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-200 dark:border-rose-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Flame className="w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-extrabold">
                SLA At Risk & Breach Alerts ({slaAtRiskTickets.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              Immediate action required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {slaAtRiskTickets.map((tkt) => {
              const sla = getSLAInfo(tkt);
              return (
                <div
                  key={tkt._id}
                  onClick={() => navigate(`/tickets/${tkt._id}`)}
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800/80 shadow-2xs hover:border-rose-400 cursor-pointer transition-colors duration-150 space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-code text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {tkt.ticketNumber || tkt.ticketCode || (tkt._id ? `TKT-${tkt._id.slice(-6).toUpperCase()}` : 'TKT')}
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {sla.timeString}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {tkt.title}
                  </h4>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION: TWO-COLUMN WORKBENCH (Open Queue & Active Claims)
      ────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton variant="rectangular" className="lg:col-span-7 h-96 rounded-2xl" />
          <Skeleton variant="rectangular" className="lg:col-span-5 h-96 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left (60%): Open Queue Table */}
          <div className="lg:col-span-7">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Open Triage Queue
                  </h3>
                  <p className="text-xs text-slate-400">
                    {openTickets.length} request{openTickets.length === 1 ? '' : 's'} awaiting manager triage & SLA assignment
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                  {openTickets.length} Open
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Summary / Title</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3">Created</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody ref={openTbodyRef} className="divide-y divide-slate-100 dark:divide-slate-800">
                    {openTickets.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-xs text-slate-400">
                          No unassigned tickets in queue.
                        </td>
                      </tr>
                    ) : (
                      openTickets.map((tkt) => {
                        const tktCode = tkt.ticketNumber || tkt.ticketCode || (tkt._id ? `TKT-${tkt._id.slice(-6).toUpperCase()}` : 'TKT');
                        return (
                          <tr
                            key={tkt._id}
                            className="hover:bg-purple-50/40 dark:hover:bg-slate-800/50 transition-colors duration-150 cursor-pointer"
                            onClick={() => navigate(`/tickets/${tkt._id}`)}
                          >
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-900 dark:text-white block truncate max-w-xs">
                                {tkt.title}
                              </span>
                              <span className="font-mono-code text-[10px] text-purple-600 dark:text-purple-400">
                                {tktCode} • {tkt.raisedBy?.email || 'Employee'}
                              </span>
                            </td>
                            <td className="px-3 py-3 capitalize">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                                {tkt.issueType || tkt.type}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-400 text-[11px]">
                              {formatRelative(tkt.createdAt)}
                            </td>
                            <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="primary"
                                icon={UserCheck}
                                onClick={() => setSelectedTicketForClaim(tkt)}
                                className="text-xs h-[30px] bg-[#6D28D9] hover:bg-purple-700"
                              >
                                Claim
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right (40%): Active Workbench with Live SLA Countdowns */}
          <div className="lg:col-span-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Active Workbench & SLA
                  </h3>
                  <p className="text-xs text-slate-400">
                    {myClaimedTickets.length} active ticket{myClaimedTickets.length === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {myClaimedTickets.length} In Progress
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-3">Title & SLA Timer</th>
                      <th className="px-2 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody ref={claimedTbodyRef} className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myClaimedTickets.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-10 text-center text-xs text-slate-400">
                          You have no claimed tickets. Claim open tickets to start work.
                        </td>
                      </tr>
                    ) : (
                      myClaimedTickets.map((tkt) => {
                        const sla = getSLAInfo(tkt);
                        const slaColors = {
                          green: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                          amber: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                          red: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse',
                          slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200'
                        };

                        return (
                          <tr
                            key={tkt._id}
                            className="hover:bg-purple-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                            onClick={() => navigate(`/tickets/${tkt._id}`)}
                          >
                            <td className="px-3 py-3 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[170px] block">
                                  {tkt.title}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 flex items-center gap-1 ${slaColors[sla.color]}`}>
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{sla.timeString}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="font-mono-code">{tkt.ticketNumber || tkt.ticketCode || (tkt._id ? `TKT-${tkt._id.slice(-6).toUpperCase()}` : 'TKT')}</span>
                                <span>•</span>
                                <span className="uppercase font-semibold text-purple-600 dark:text-purple-400">{tkt.priority || 'P3'}</span>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-right">
                              <Button size="sm" variant="secondary" className="text-xs h-[28px]">
                                Work
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION: BREACH HISTORY (Collapsible Past 7 Days)
      ────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBreachHistory(!showBreachHistory)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <History className="w-4 h-4 text-purple-600" />
            <span>SLA Breach Log & History (Past 7 Days)</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {pastBreachedTickets.length} Breaches
            </span>
          </div>
          {showBreachHistory ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showBreachHistory && (
          <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800">
            {pastBreachedTickets.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Excellent! Zero tickets breached their SLA deadlines in the last 7 days.
              </p>
            ) : (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">Ticket</th>
                      <th className="px-3 py-2.5">Priority</th>
                      <th className="px-3 py-2.5">Breach Duration</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pastBreachedTickets.map((tkt) => {
                      const sla = getSLAInfo(tkt);
                      return (
                        <tr
                          key={tkt._id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                          onClick={() => navigate(`/tickets/${tkt._id}`)}
                        >
                          <td className="px-4 py-2.5">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {tkt.title}
                            </span>
                            <span className="text-[10px] font-mono-code text-slate-400">
                              {tkt.ticketNumber || tkt.ticketCode || (tkt._id ? `TKT-${tkt._id.slice(-6).toUpperCase()}` : 'TKT')}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 uppercase font-bold text-rose-600">
                            {tkt.priority || 'P3'}
                          </td>
                          <td className="px-3 py-2.5 text-rose-600 dark:text-rose-400 font-semibold">
                            {sla.timeString}
                          </td>
                          <td className="px-3 py-2.5 capitalize">
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800">
                              {tkt.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Priority Claim Modal */}
      <Modal
        isOpen={Boolean(selectedTicketForClaim)}
        onClose={() => setSelectedTicketForClaim(null)}
        title="Claim Ticket & Assign SLA Priority"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedTicketForClaim(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmClaim} loading={isClaiming} className="bg-[#6D28D9] hover:bg-purple-700">
              Confirm Claim
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Set SLA resolution priority for <strong>{selectedTicketForClaim?.title}</strong>:
          </p>

          <div className="space-y-2">
            {[
              { val: 'p1', label: 'P1 Critical (SLA: 2 Hours)', desc: 'Work-stoppage or critical failure' },
              { val: 'p2', label: 'P2 High (SLA: 8 Hours)', desc: 'Major operational disruption' },
              { val: 'p3', label: 'P3 Medium (SLA: 24 Hours)', desc: 'Standard service request' },
              { val: 'p4', label: 'P4 Low (SLA: 72 Hours)', desc: 'Minor issue or general inquiry' }
            ].map((p) => (
              <label
                key={p.val}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedPriority === p.val
                    ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p.val}
                  checked={selectedPriority === p.val}
                  onChange={() => setSelectedPriority(p.val)}
                  className="mt-0.5 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-bold block">{p.label}</span>
                  <span className="text-[11px] text-slate-400 font-normal">{p.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TicketQueue;
