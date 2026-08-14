import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Ticket,
  HardDrive,
  User,
  LogOut,
  Laptop,
  CheckCheck,
  Shield,
  Building,
  ChevronDown,
  Search
} from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import GlobalSearch from '../ui/GlobalSearch.jsx';
import { useAuthStore } from '../../stores/auth.store.js';
import { useUiStore } from '../../stores/ui.store.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { formatRelative } from '../../utils/formatters.js';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, theme, toggleTheme } = useUiStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const bellRef = useRef(null);
  const bellRippleRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const prevUnreadRef = useRef(unreadCount);

  // GSAP Notification Bell Alert Bounce + Ripple
  useEffect(() => {
    if (unreadCount > 0 && unreadCount > prevUnreadRef.current) {
      if (bellRef.current) {
        gsap.killTweensOf(bellRef.current);
        gsap.to(bellRef.current, {
          keyframes: [
            { rotation: 0 },
            { rotation: -15 },
            { rotation: 15 },
            { rotation: -10 },
            { rotation: 10 },
            { rotation: 0 }
          ],
          duration: 0.5,
          ease: 'elastic.out(1, 0.3)'
        });
      }

      if (bellRippleRef.current) {
        gsap.killTweensOf(bellRippleRef.current);
        gsap.fromTo(
          bellRippleRef.current,
          { scale: 0.6, opacity: 0.8 },
          { scale: 1.5, opacity: 0, duration: 0.6, ease: 'power2.out' }
        );
      }
    }
    prevUnreadRef.current = unreadCount;

    return () => {
      if (bellRef.current) gsap.killTweensOf(bellRef.current);
      if (bellRippleRef.current) gsap.killTweensOf(bellRippleRef.current);
    };
  }, [unreadCount]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n) => {
    if (!n.read) markAsRead(n._id);
    if (n.type?.includes('ticket') && n.relatedId) navigate(`/ticket/${n.relatedId}`);
    else if (n.type?.includes('asset') && n.relatedId) navigate(`/assets/${n.relatedId}`);
    setNotificationsOpen(false);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  // Route title mapper
  const getPageTitle = (pathname) => {
    if (pathname.includes('/admin/dashboard')) return 'Platform Overview';
    if (pathname.includes('/admin/organizations')) return 'Tenant Command Center';
    if (pathname.includes('/admin/plans')) return 'Subscription Plans';
    if (pathname.includes('/admin/analytics')) return 'Global Analytics';
    if (pathname.includes('/admin/support')) return 'Admin Requests';
    if (pathname.includes('/admin/settings')) return 'System Settings';
    if (pathname.includes('/my-assets')) return 'My Assets';
    if (pathname.includes('/my-tickets')) return 'My Tickets';
    if (pathname.includes('/ticket/')) return 'Ticket Overview';
    if (pathname === '/tickets') return 'Ticket Queue';
    if (pathname.startsWith('/tickets/')) return 'Active Workbench';
    if (pathname.startsWith('/assets/')) return 'Asset Details';
    if (pathname.includes('/assets')) return 'Asset Inventory';
    if (pathname.includes('/inspections')) return 'Inspection Queue';
    if (pathname.includes('/dashboard')) return 'Executive Dashboard';
    if (pathname.includes('/exceptions')) return 'Exception Queue';
    if (pathname.includes('/procurement')) return 'Procurement Approvals';
    if (pathname.includes('/retirements')) return 'Retirement Approvals';
    if (pathname.includes('/locations')) return 'Facility Locations';
    if (pathname.includes('/departments')) return 'Departments';
    if (pathname.includes('/categories')) return 'Asset Categories';
    if (pathname.includes('/vendors')) return 'Vendors Directory';
    if (pathname.includes('/employees')) return 'Employees & Personnel';
    return 'AssetOwl Intelligence';
  };

  const roleLabels = {
    super_admin: 'Root Super Admin',
    org_admin: 'Organization Admin',
    asset_manager: 'Asset Manager',
    employee: 'Employee'
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-purple-100 dark:border-purple-900/40 shadow-xs transition-colors duration-200">
        {/* Left: Dynamic Page Title & Mobile Hamburger */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 text-slate-500 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors lg:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-bold text-slate-900 dark:text-purple-50 tracking-tight">
            {getPageTitle(location.pathname)}
          </h2>
        </div>

        {/* Center: Global Search Trigger */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#6D28D9] dark:text-purple-400" />
              <span>Search tenants, fleet, tickets...</span>
            </div>
            <kbd className="text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-500">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Notification Bell, Theme toggle, User Menu */}
        <div className="flex items-center gap-2.5">
          {/* Mobile search icon */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-slate-500 hover:text-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 md:hidden cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme toggle button */}
          <button
            type="button"
            onClick={toggleTheme}
            title="Toggle Light / Dark Theme"
            className="p-2 text-slate-500 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-purple-700" />
            )}
          </button>

        {/* Notification Bell Dropdown Container */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`p-2 rounded-xl transition-colors relative cursor-pointer border ${
              notificationsOpen
                ? 'bg-purple-100/70 dark:bg-purple-950 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                : 'text-slate-500 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/50 border-transparent hover:border-purple-200 dark:hover:border-purple-800'
            }`}
          >
            {/* Ripple ring for new notifications */}
            <span
              ref={bellRippleRef}
              className="pointer-events-none absolute inset-0 rounded-xl border-2 border-purple-500 opacity-0"
            />
            <span ref={bellRef} className="inline-block origin-top">
              <Bell className="w-4 h-4" />
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md shadow-purple-600/40 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Menu */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-92 bg-white/98 dark:bg-slate-950/98 backdrop-blur-xl rounded-2xl shadow-2xl shadow-purple-500/10 dark:shadow-purple-950/60 border border-purple-100 dark:border-purple-900/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 border-b border-purple-100 dark:border-purple-900/40 flex justify-between items-center bg-purple-50/60 dark:bg-purple-950/40">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-purple-100 uppercase tracking-wider">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-purple-50 dark:divide-purple-900/20">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-purple-300/50">
                    <Bell className="w-7 h-7 mx-auto mb-2 opacity-30 text-purple-500" />
                    No automated notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 text-xs transition-colors cursor-pointer flex gap-3 ${
                        !n.read
                          ? 'border-l-3 border-l-purple-600 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/40'
                          : 'hover:bg-purple-50/30 dark:hover:bg-slate-900/80 text-slate-600 dark:text-purple-200'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 h-fit mt-0.5 border border-purple-200/60 dark:border-purple-800/60">
                        {n.type?.includes('ticket') ? (
                          <Ticket className="w-3.5 h-3.5" />
                        ) : (
                          <HardDrive className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 dark:text-purple-100">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-purple-400/60">
                            {formatRelative(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-purple-200/80 leading-relaxed text-[11px]">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Dropdown Container */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950/50 border border-transparent hover:border-purple-200 dark:hover:border-purple-800/80 transition-all cursor-pointer group"
          >
            <Avatar name={user?.name || user?.email || 'User'} size="sm" />
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-purple-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 block truncate max-w-[120px]">
                {user?.name || user?.email?.split('@')[0]}
              </span>
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 capitalize block">
                {user?.role ? user.role.replace('_', ' ') : 'Member'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors ml-0.5" />
          </button>

          {/* User Profile Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white/98 dark:bg-slate-950/98 backdrop-blur-xl rounded-2xl shadow-2xl shadow-purple-500/10 dark:shadow-purple-950/60 border border-purple-100 dark:border-purple-900/50 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header Info */}
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/30 mb-2">
                <p className="text-xs font-bold text-slate-900 dark:text-purple-100 truncate">
                  {user?.name || 'Workspace User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-purple-300 font-mono truncate mt-0.5">
                  {user?.email}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700/60">
                    {roleLabels[user?.role] || user?.role}
                  </span>
                  {user?.organizationName && (
                    <span className="text-[10px] text-slate-500 dark:text-purple-300/80 truncate">
                      • {user.organizationName}
                    </span>
                  )}
                </div>
              </div>

              {/* Role-Specific Menu Links */}
              <div className="space-y-1 text-xs font-medium">
                {user?.role === 'employee' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/my-assets');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-100 transition-colors cursor-pointer text-left"
                    >
                      <Laptop className="w-4 h-4 text-purple-500" />
                      <span>My Equipment & Assets</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/my-tickets');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-100 transition-colors cursor-pointer text-left"
                    >
                      <Ticket className="w-4 h-4 text-purple-500" />
                      <span>Support Tickets</span>
                    </button>
                  </>
                )}

                {user?.role === 'asset_manager' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/tickets');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-100 transition-colors cursor-pointer text-left"
                    >
                      <Ticket className="w-4 h-4 text-purple-500" />
                      <span>Ticket Workbench</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/assets');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-100 transition-colors cursor-pointer text-left"
                    >
                      <Laptop className="w-4 h-4 text-purple-500" />
                      <span>Asset Inventory</span>
                    </button>
                  </>
                )}

                {user?.role === 'org_admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-100 transition-colors cursor-pointer text-left"
                  >
                    <Building className="w-4 h-4 text-purple-500" />
                    <span>Organization Settings</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-100 transition-colors cursor-pointer text-left"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-purple-600" />
                  )}
                  <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                </button>

                <div className="h-px bg-purple-100 dark:bg-purple-900/40 my-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer text-left font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Global Search Command Palette (Ctrl+K) */}
    <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
  </>
);
};

export default Navbar;
