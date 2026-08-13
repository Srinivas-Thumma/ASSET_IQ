import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  CheckCheck,
  Laptop,
  Lock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Shield,
  ShieldAlert,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  FileText,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
  MessageSquare,
  Tag,
  Hash
} from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import Modal from '../ui/Modal.jsx';
import Textarea from '../ui/Textarea.jsx';
import Select from '../ui/Select.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import Breadcrumbs from '../ui/Breadcrumbs.jsx';
import { useAuthStore } from '../../stores/auth.store.js';
import { useTickets } from '../../hooks/useTickets.js';
import { useTicketSocket } from '../../hooks/useTicketSocket.js';
import { formatDate, formatRelative } from '../../utils/formatters.js';
import { toast } from 'sonner';

export const TicketDiscussionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isManagerOrAdmin = user?.role === 'asset_manager' || user?.role === 'org_admin' || user?.role === 'super_admin';

  const {
    ticket,
    isDetailLoading,
    updateStatus,
    addMessage,
    claimTicket,
    escalateTicket,
    resolveTicket,
    isEscalating
  } = useTickets(id);

  // Live WebSocket synchronization
  useTicketSocket(id);

  // Chat state
  const [activeTab, setActiveTab] = useState('public'); // 'public' | 'internal'
  const [inputText, setInputText] = useState('');
  const [isInternalToggle, setIsInternalToggle] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(null);

  // Manager action state
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assetStateChange, setAssetStateChange] = useState('stock');
  const [isResolving, setIsResolving] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(ticket?.priority || 'p3');

  // UI responsive sidebars
  const [showRightPanel, setShowRightPanel] = useState(true);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [ticket?.messages?.length, activeTab]);

  if (isDetailLoading) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-4 p-2 animate-pulse">
        <div className="w-full lg:w-64 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-4">
          <Skeleton variant="text" className="h-6 w-32" />
          <Skeleton count={5} />
        </div>
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <Skeleton variant="rectangular" className="h-12 rounded-xl" />
          <div className="space-y-3 pt-6">
            <Skeleton variant="rectangular" className="h-16 w-2/3 rounded-2xl ml-auto" />
            <Skeleton variant="rectangular" className="h-16 w-2/3 rounded-2xl mr-auto" />
            <Skeleton variant="rectangular" className="h-16 w-1/2 rounded-2xl ml-auto" />
          </div>
        </div>
        <div className="hidden lg:block w-72 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-4">
          <Skeleton variant="rectangular" className="h-32 rounded-xl" />
          <Skeleton count={4} />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-950/50 rounded-2xl text-purple-600 dark:text-purple-400">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Ticket Not Found
        </h3>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested service ticket does not exist, has been resolved, or you do not have permission to view it.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate(isManagerOrAdmin ? '/tickets' : '/my-tickets')}
        >
          Return to {isManagerOrAdmin ? 'Ticket Queue' : 'My Tickets'}
        </Button>
      </div>
    );
  }

  const allMessages = ticket.messages || [];
  const publicMessages = allMessages.filter((m) => !m.isInternal);
  const internalMessages = allMessages.filter((m) => m.isInternal);
  const displayedMessages = activeTab === 'public' ? publicMessages : internalMessages;

  const ticketCode = ticket.ticketNumber || `TKT-${ticket._id?.substring(0, 4).toUpperCase()}`;

  // Priority color config
  const priorityConfig = {
    p1: { label: 'P1 Critical', bg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
    p2: { label: 'P2 High', bg: 'bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    p3: { label: 'P3 Medium', bg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    p4: { label: 'P4 Low', bg: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' }
  };
  const currentPriority = priorityConfig[ticket.priority?.toLowerCase()] || priorityConfig.p3;

  // Status color config
  const statusConfig = {
    open: { label: 'Open', dot: 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-900', badge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' },
    claimed: { label: 'Claimed', dot: 'bg-indigo-500 ring-indigo-200 dark:ring-indigo-900', badge: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300' },
    in_progress: { label: 'In Progress', dot: 'bg-amber-500 ring-amber-200 dark:ring-amber-900', badge: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' },
    resolved: { label: 'Resolved', dot: 'bg-purple-500 ring-purple-200 dark:ring-purple-900', badge: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300' },
    closed: { label: 'Closed', dot: 'bg-slate-400 ring-slate-200 dark:ring-slate-800', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' }
  };
  const currentStatus = statusConfig[ticket.status?.toLowerCase()] || statusConfig.open;

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isSending) return;

    setIsSending(true);
    try {
      const isMsgInternal = activeTab === 'internal' || isInternalToggle;
      await addMessage({
        ticketId: ticket._id,
        message: cleanText,
        isInternal: isMsgInternal
      });
      setInputText('');
      setIsInternalToggle(false);
      setTimeout(() => scrollToBottom(true), 50);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEscalate = async () => {
    if (!ticket?._id) return;
    try {
      await escalateTicket(ticket._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to escalate ticket');
    }
  };

  const handleResolveSubmit = async () => {
    if (!ticket?._id) return;
    setIsResolving(true);
    try {
      await resolveTicket({
        id: ticket._id,
        resolutionNotes,
        assetStateChange
      });
      setIsResolveModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve ticket');
    } finally {
      setIsResolving(false);
    }
  };

  const handleClaimThisTicket = async () => {
    try {
      await claimTicket({ id: ticket._id, priority: selectedPriority });
      toast.success('You have claimed this ticket');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim ticket');
    }
  };

  // Helper to format date divider
  const getDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to format message time (e.g. "2:34 PM")
  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          ZONE 1: LEFT SIDEBAR (~240px) — Ticket Metadata & Overview
      ────────────────────────────────────────────────────────────── */}
      <aside className="hidden xl:flex w-64 shrink-0 flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-y-auto p-4 space-y-4">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: isManagerOrAdmin ? 'Ticket Queue' : 'My Tickets', to: isManagerOrAdmin ? '/tickets' : '/my-tickets' },
            { label: ticketCode }
          ]}
          className="mb-0"
        />

        {/* Back Navigation */}
        <button
          type="button"
          onClick={() => navigate(isManagerOrAdmin ? '/tickets' : '/my-tickets')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isManagerOrAdmin ? 'Queue' : 'My Tickets'}</span>
        </button>

        {/* Ticket Header & Status */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-md">
              {ticketCode}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ring-2 ${currentStatus.dot}`} />
              <span className="text-[11px] font-bold capitalize text-slate-700 dark:text-slate-300">
                {currentStatus.label}
              </span>
            </div>
          </div>

          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
            {ticket.title}
          </h2>
        </div>

        {/* Metadata Badges & Attributes */}
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Priority SLA
            </span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentPriority.bg}`}>
              {currentPriority.label}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Issue Category
            </span>
            <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">
              {ticket.issueType || ticket.type || 'General Support'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Submitted By
            </span>
            <div className="flex items-center gap-2">
              <Avatar name={ticket.raisedBy?.email || 'User'} size="sm" />
              <div className="truncate">
                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                  {ticket.raisedBy?.name || ticket.raisedBy?.email?.split('@')[0] || 'Employee'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {ticket.raisedBy?.email}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Assigned IT Specialist
            </span>
            {ticket.handler ? (
              <div className="flex items-center gap-2">
                <Avatar name={ticket.handler?.email || 'IT Handler'} size="sm" />
                <div className="truncate">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                    {ticket.handler?.name || ticket.handler?.email?.split('@')[0] || 'Asset Manager'}
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block">
                    IT Support
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="italic text-[11px]">Unclaimed in Queue</span>
                {isManagerOrAdmin && (
                  <button
                    onClick={handleClaimThisTicket}
                    className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                  >
                    Claim Now
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Created Timeline
            </span>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatRelative(ticket.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Initial Description Preview */}
        {ticket.description && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Initial Request Notes
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-6 leading-relaxed">
              {ticket.description}
            </p>
          </div>
        )}
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          ZONE 2: CENTER CANVAS (Hero ~60-70%) — WhatsApp-Style Chat
      ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Compact Sticky Header Bar */}
        <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(isManagerOrAdmin ? '/tickets' : '/my-tickets')}
              className="xl:hidden p-1.5 -ml-1 text-slate-500 hover:text-purple-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-md shrink-0">
              {ticketCode}
            </span>

            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full ring-2 ${currentStatus.dot} shrink-0`} />
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {ticket.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentPriority.bg}`}>
              {currentPriority.label}
            </span>
            <span className="text-[11px] text-slate-400 hidden md:inline-block">
              Opened {formatRelative(ticket.createdAt)}
            </span>
            <button
              type="button"
              onClick={() => setShowRightPanel(!showRightPanel)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Toggle asset details"
            >
              <Laptop className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimal Segmented Tab Control (Public Chat vs Internal Notes) */}
        {isManagerOrAdmin && (
          <div className="px-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-6 bg-slate-50/50 dark:bg-slate-850/50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('public')}
              className={`h-9 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
                activeTab === 'public'
                  ? 'text-purple-700 dark:text-purple-300 border-b-2 border-purple-600'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <span>Public Discussion</span>
              <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">
                {publicMessages.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('internal')}
              className={`h-9 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === 'internal'
                  ? 'text-amber-700 dark:text-amber-300 border-b-2 border-amber-600'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Internal Staff Notes</span>
              {internalMessages.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {internalMessages.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* WhatsApp-Style Open Canvas Message Thread */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 transition-colors ${
            activeTab === 'internal'
              ? 'bg-amber-50/30 dark:bg-amber-950/15'
              : 'bg-[#F8FAFC]/70 dark:bg-slate-950/60'
          }`}
        >
          {displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {activeTab === 'internal'
                  ? 'No internal staff notes recorded yet.'
                  : 'Start the conversation — IT will be notified immediately.'}
              </p>
              <span className="text-[11px] text-slate-400">
                {activeTab === 'internal'
                  ? 'Internal notes are only visible to managers and admins.'
                  : 'Type a message below to coordinate diagnosis and resolution.'}
              </span>
            </div>
          ) : (
            displayedMessages.map((msg, index) => {
              const isMe = msg.senderId === user?._id || msg.senderEmail === user?.email;
              const isSystem = msg.isSystemMessage || msg.senderRole === 'system';

              // Date Divider logic
              const prevMsg = displayedMessages[index - 1];
              const showDateDivider =
                !prevMsg ||
                new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

              // Grouping logic: check if next message is from same sender
              const nextMsg = displayedMessages[index + 1];
              const isLastInGroup =
                !nextMsg ||
                nextMsg.senderId !== msg.senderId ||
                nextMsg.isSystemMessage !== msg.isSystemMessage;

              // Check if first message in group to show sender name
              const isFirstInGroup =
                !prevMsg ||
                prevMsg.senderId !== msg.senderId ||
                prevMsg.isSystemMessage !== msg.isSystemMessage;

              if (isSystem) {
                return (
                  <React.Fragment key={msg._id || index}>
                    {showDateDivider && (
                      <div className="flex justify-center my-3">
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-2xs">
                          {getDateLabel(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-center my-2">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                        <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>{msg.message}</span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={msg._id || index}>
                  {showDateDivider && (
                    <div className="flex justify-center my-3">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-2xs">
                        {getDateLabel(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-1'}`}>
                    {/* Left Avatar for other users */}
                    {!isMe && (
                      <div className="w-7 h-7 shrink-0">
                        {isLastInGroup ? (
                          <Avatar name={msg.senderName || msg.senderEmail} size="sm" />
                        ) : (
                          <div className="w-7" />
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Sender name above first message in cluster */}
                      {!isMe && isFirstInGroup && (
                        <div className="flex items-center gap-1.5 mb-1 pl-1">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {msg.senderName || msg.senderEmail?.split('@')[0]}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950">
                            {msg.senderRole === 'asset_manager' ? 'IT Support' : msg.senderRole || 'Member'}
                          </span>
                        </div>
                      )}

                      {/* WhatsApp Chat Bubble */}
                      <div
                        className={`relative px-4 py-2.5 shadow-xs transition-all ${
                          isMe
                            ? 'bg-[#F3E8FF] dark:bg-purple-950/80 text-slate-900 dark:text-purple-100 rounded-2xl rounded-br-xs border border-purple-200/60 dark:border-purple-800/60'
                            : msg.isInternal
                            ? 'bg-amber-100/90 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 rounded-2xl rounded-bl-xs border border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-xs border border-slate-200/90 dark:border-slate-800'
                        }`}
                      >
                        {msg.isInternal && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Internal Staff Note</span>
                          </div>
                        )}

                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>

                        {/* Timestamp & Double Checkmarks inside bubble bottom-right */}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                          <span>{formatMsgTime(msg.createdAt)}</span>
                          {isMe && (
                            <CheckCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Avatar for current user */}
                    {isMe && (
                      <div className="w-7 h-7 shrink-0">
                        {isLastInGroup ? (
                          <Avatar name={user?.name || user?.email} size="sm" />
                        ) : (
                          <div className="w-7" />
                        )}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })
          )}

          {/* Typing Indicator */}
          {otherUserTyping && (
            <div className="flex items-center gap-2 text-slate-400 pl-9 py-1">
              <div className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {otherUserTyping} is typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─────────────────────────────────────────────────────────────
            ZONE 2 COMPOSER: Sticky Bottom Bar (Rounded WhatsApp Pill)
        ────────────────────────────────────────────────────────────── */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
          {/* Internal note checkbox toggle (for managers/admins) */}
          {isManagerOrAdmin && activeTab === 'public' && (
            <div className="flex items-center gap-2 pl-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInternalToggle}
                  onChange={(e) => setIsInternalToggle(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <Lock className="w-3 h-3 text-amber-500" />
                <span className="text-[11px] font-medium">
                  Internal note (only visible to IT team)
                </span>
              </label>
            </div>
          )}

          {/* Sticky Rounded Input Bar */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeTab === 'internal' || isInternalToggle
                    ? 'Write an internal note for staff...'
                    : 'Type a message...'
                }
                className="w-full h-12 pl-5 pr-12 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500 shadow-2xs transition-all"
              />
            </div>

            {/* Circular Purple Send Button (#6D28D9, 40px) */}
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md cursor-pointer ${
                inputText.trim() && !isSending
                  ? 'bg-[#6D28D9] hover:bg-purple-700 text-white shadow-purple-600/30 scale-100'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
              title="Send (Enter)"
            >
              <Send className="w-4 h-4 -ml-0.5" />
            </button>
          </form>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          ZONE 3: RIGHT SIDEBAR (~260px) — Linked Hardware Specs & Actions
      ────────────────────────────────────────────────────────────── */}
      {showRightPanel && (
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Hardware Specs Card */}
          {ticket.assetId && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Associated Equipment
                </span>
                <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                  {ticket.assetId?.assetCode || 'HW-UNIT'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Laptop className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {ticket.assetId?.name || 'Assigned Workstation'}
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize block">
                    Status: {ticket.assetId?.status || 'Active'}
                  </span>
                </div>
              </div>

              {/* Action link to full asset details */}
              <button
                type="button"
                onClick={() => navigate(`/assets/${ticket.assetId?._id || ticket.assetId}`)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-100 dark:border-slate-700"
              >
                <span>View Hardware Specs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action Control Panel (Managers / Admins) */}
          {isManagerOrAdmin && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-100 dark:border-slate-800">
                Triage & Resolution Actions
              </span>

              {ticket.status === 'resolved' ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ticket Resolved</span>
                  </div>
                  {ticket.resolutionNotes && (
                    <p className="text-[11px] text-slate-600 dark:text-emerald-200/80">
                      Notes: {ticket.resolutionNotes}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsResolveModalOpen(true)}
                    className="text-[11px] w-full text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                  >
                    Update Resolution Details
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    icon={CheckCircle2}
                    onClick={() => setIsResolveModalOpen(true)}
                    className="w-full text-xs justify-center bg-[#6D28D9] hover:bg-purple-700 shadow-purple-600/20"
                  >
                    Resolve Ticket
                  </Button>

                  {ticket.isEscalated ? (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Escalated to Vendor Tier</span>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      icon={AlertTriangle}
                      onClick={handleEscalate}
                      loading={isEscalating}
                      className="w-full text-xs justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    >
                      Escalate Ticket
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Employee Help Card */}
          {!isManagerOrAdmin && (
            <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/40 dark:to-slate-900 rounded-2xl border border-purple-100 dark:border-purple-900/60 text-xs space-y-2">
              <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Live Support Active</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Our IT team has been alerted and will diagnose your request. Replies in this discussion appear instantly.
              </p>
            </div>
          )}
        </aside>
      )}

      {/* Resolution Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Complete Ticket Resolution"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResolveSubmit} loading={isResolving} className="bg-[#6D28D9] hover:bg-purple-700">
              Confirm Resolution
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <Textarea
            label="Resolution Notes"
            rows={3}
            placeholder="Document repair actions, diagnostic test results, or replacement details..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />

          <Select
            label="Hardware State Transition"
            value={assetStateChange}
            onChange={(e) => setAssetStateChange(e.target.value)}
            options={[
              { value: 'stock', label: 'Return to Stock (Operational)' },
              { value: 'assigned', label: 'Keep in Assigned Custody' },
              { value: 'repair', label: 'Keep in Repair / Awaiting parts' },
              { value: 'retired', label: 'Condemn / Request Retirement' }
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};

export default TicketDiscussionView;
