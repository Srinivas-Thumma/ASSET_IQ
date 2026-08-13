import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  CheckCheck,
  Headphones,
  Bot,
  User,
  Shield,
  Clock,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useSocket } from '../../hooks/useSocket.js';
import { ticketApi } from '../../api/ticket.api.js';
import { toast } from 'sonner';

export const TicketChat = ({
  ticketId,
  messages = [],
  onNewMessage,
  readOnly = false
}) => {
  const { user } = useAuth();
  const socketRef = useSocket();

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  // WebSocket Typing Listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !ticketId) return;

    socket.emit('join-ticket', ticketId);

    const handleUserTyping = (data) => {
      if (data?.user && data.user !== user?.name && data.user !== user?.email) {
        setOtherUserTyping(data.user);
      }
    };

    const handleUserStopTyping = () => {
      setOtherUserTyping(null);
    };

    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    return () => {
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
    };
  }, [socketRef, ticketId, user]);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    const socket = socketRef.current;
    if (!socket || !ticketId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { ticketId, user: user?.name || user?.email || 'User' });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop-typing', { ticketId, user: user?.name || user?.email || 'User' });
    }, 2000);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const cleanText = inputMessage.trim();
    if (!cleanText || isSending || readOnly) return;

    setIsSending(true);
    try {
      const socket = socketRef.current;
      if (socket) {
        socket.emit('stop-typing', { ticketId, user: user?.name || user?.email || 'User' });
      }
      setIsTyping(false);

      const savedMsg = await ticketApi.addMessage(ticketId, cleanText, false);
      setInputMessage('');
      if (onNewMessage) onNewMessage(savedMsg);
      scrollToBottom(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[520px] bg-slate-50/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Direct Discussion Channel
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Start the conversation — IT support specialists and asset managers are notified immediately.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSystem = msg.isSystemMessage || msg.senderRole === 'system';
            const isMe = String(msg.senderId) === String(user?._id) || msg.senderRole === 'employee';

            // 1. System Notification Pill
            if (isSystem) {
              return (
                <div key={msg._id || index} className="flex justify-center my-2">
                  <div className="px-3.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5 shadow-xs border border-slate-300/60 dark:border-slate-700">
                    <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>{msg.message}</span>
                    <span className="text-[10px] text-slate-400">({formatRelativeTime(msg.createdAt)})</span>
                  </div>
                </div>
              );
            }

            // 2. User & Agent Bubbles
            return (
              <div
                key={msg._id || index}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* Agent Avatar on Left */}
                {!isMe && (
                  <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 mb-1">
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-xs text-xs space-y-1 transition-all ${
                    isMe
                      ? 'bg-purple-600 dark:bg-purple-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {/* Sender Header */}
                  <div
                    className={`flex items-center gap-2 text-[10px] font-bold ${
                      isMe ? 'text-purple-200' : 'text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    <span>{isMe ? 'You' : msg.senderName || 'IT Support'}</span>
                    {!isMe && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px]">
                        Support
                      </span>
                    )}
                  </div>

                  {/* Message Content */}
                  <p className="leading-relaxed whitespace-pre-wrap font-normal select-text">
                    {msg.message}
                  </p>

                  {/* Timestamp & Status Indicator */}
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] pt-0.5 ${
                      isMe ? 'text-purple-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatRelativeTime(msg.createdAt)}</span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-purple-200 inline" />}
                  </div>
                </div>

                {/* Employee Avatar on Right */}
                {isMe && (
                  <Avatar
                    name={user?.name || user?.email || 'John Snow'}
                    size="sm"
                    className="shrink-0 mb-1"
                  />
                )}
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {otherUserTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic pl-9">
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </span>
            <span>{otherUserTyping} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Input Bar */}
      {!readOnly && (
        <form
          onSubmit={handleSend}
          className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type your message... (Press Enter to send)"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-950 transition-all"
          />

          <Button
            type="submit"
            variant="primary"
            icon={Send}
            loading={isSending}
            disabled={!inputMessage.trim()}
            className="rounded-xl px-4 py-2.5 h-[38px] shrink-0 shadow-xs"
          >
            Send
          </Button>
        </form>
      )}
    </div>
  );
};

export default TicketChat;
