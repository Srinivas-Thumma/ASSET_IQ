import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Ticket, HardDrive, Bell } from 'lucide-react';
import { formatRelative } from '../../utils/formatters.js';

export const NotificationDropdown = ({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onClose
}) => {
  const navigate = useNavigate();

  const handleNotificationClick = (n) => {
    if (!n.read && onMarkRead) {
      onMarkRead(n._id);
    }
    if (n.type?.includes('ticket') && n.relatedId) {
      navigate(`/ticket/${n.relatedId}`);
    } else if (n.type?.includes('asset') && n.relatedId) {
      navigate(`/assets/${n.relatedId}`);
    }
    if (onClose) onClose();
  };

  return (
    <div className="w-80 sm:w-96 max-h-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            System Notifications
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {unreadCount} unread automated alerts
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 max-h-80">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No new notifications
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3.5 text-xs transition-colors cursor-pointer flex gap-3 ${
                n.read
                  ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  : 'bg-indigo-50/40 dark:bg-indigo-950/40 hover:bg-indigo-50/70 border-l-3 border-indigo-600 dark:border-indigo-400'
              }`}
            >
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 h-fit mt-0.5">
                {n.type?.includes('ticket') ? (
                  <Ticket className="w-3.5 h-3.5" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {n.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
