import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  CreditCard,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  Search,
  Bell,
  Activity,
  X,
  Laptop,
  Users,
  Ticket,
  CheckCheck,
  AlertTriangle,
  Info,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../stores/auth.store.js';
import useUiStore from '../../stores/ui.store.js';
import Button from '../ui/Button.jsx';
import PageWrapper from './PageWrapper.jsx';
import adminApi from '../../api/admin.api.js';
import { formatRelative } from '../../utils/formatters.js';

export const SuperAdminLayout = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Search Modal & Drawer state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);

  const notifRef = useRef(null);

  // Queries for Global Search, Alerts & Live Activity
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['superadmin-search', searchQuery],
    queryFn: () => adminApi.searchGlobal(searchQuery),
    enabled: searchQuery.trim().length > 1
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['superadmin-alerts'],
    queryFn: adminApi.getAlerts,
    refetchInterval: 30000
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['superadmin-activity'],
    queryFn: adminApi.getActivity,
    refetchInterval: 15000
  });

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Organizations', path: '/admin/organizations', icon: Building2 },
    { label: 'Subscription Plans', path: '/admin/plans', icon: CreditCard },
    { label: 'Global Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Admin Requests', path: '/admin/support', icon: Ticket }
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Super Admin Navigation Header */}
      <header className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-purple-100 dark:border-purple-900/40 sticky top-0 z-40 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="AssetOwl Logo"
                className="w-8 h-8 rounded-xl object-contain shadow-md shadow-purple-600/20"
              />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                  AssetOwl
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Super Admin
                </span>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 shadow-xs'
                          : 'text-slate-600 dark:text-purple-300/80 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/40'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Center/Right: Global Search Trigger Button */}
          <div className="flex-1 max-w-xs hidden lg:block">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Search tenants, fleet, tickets...</span>
              </div>
              <kbd className="text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-500">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Notification Bell, Live Activity toggle, Theme Toggle & User Info */}
          <div className="flex items-center gap-2.5">
            {/* Search Icon button on mobile */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-slate-500 hover:text-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 lg:hidden cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-xl transition-colors relative cursor-pointer border ${
                  isNotifOpen
                    ? 'bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                    : 'text-slate-500 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/50 border-transparent hover:border-purple-200 dark:hover:border-purple-800'
                }`}
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md shadow-purple-600/40">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Alerts Dropdown Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/98 dark:bg-slate-950/98 backdrop-blur-xl rounded-2xl shadow-2xl shadow-purple-500/10 dark:shadow-purple-950/60 border border-purple-100 dark:border-purple-900/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 border-b border-purple-100 dark:border-purple-900/40 flex justify-between items-center bg-purple-50/60 dark:bg-purple-950/40">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-purple-100 uppercase tracking-wider">
                        Platform Alerts
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                        {alerts.length} events
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-purple-50 dark:divide-purple-900/20">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No critical platform alerts
                      </div>
                    ) : (
                      alerts.map((alt) => (
                        <div
                          key={alt.id}
                          onClick={() => {
                            if (alt.url) navigate(alt.url);
                            setIsNotifOpen(false);
                          }}
                          className={`p-3 text-xs transition-colors cursor-pointer flex gap-3 ${
                            alt.severity === 'critical'
                              ? 'border-l-3 border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                              : alt.severity === 'warning'
                              ? 'border-l-3 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/20'
                              : 'border-l-3 border-l-purple-600 hover:bg-purple-50/30'
                          }`}
                        >
                          <div className="mt-0.5">
                            {alt.severity === 'critical' ? (
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                            ) : alt.severity === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Info className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-purple-100">
                                {alt.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatRelative(alt.createdAt)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-purple-200/80 leading-relaxed">
                              {alt.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Live Activity Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsActivityDrawerOpen(!isActivityDrawerOpen)}
              title="Platform Activity Feed"
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isActivityDrawerOpen
                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300'
                  : 'text-slate-500 dark:text-purple-300 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50 border-transparent'
              }`}
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle Theme"
              className="p-2 text-slate-500 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-purple-700" />
              )}
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            {/* User Info & Logout */}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {user?.email || 'superadmin@assetiq.com'}
              </div>
              <div className="text-[9px] text-purple-600 dark:text-purple-400 font-extrabold uppercase tracking-wider">
                Root Superadmin
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              icon={LogOut}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Admin Body with Optional Activity Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 max-w-7xl mx-auto w-full">
          <PageWrapper pageId={location.pathname}>
            <Outlet />
          </PageWrapper>
        </main>

        {/* Collapsible Recent Activity Drawer */}
        {isActivityDrawerOpen && (
          <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-30 shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Activity Feed
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActivityDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {activity.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No recent activity logged</p>
              ) : (
                activity.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-purple-600 dark:text-purple-400 truncate max-w-[120px]">
                        {item.orgName || 'Platform'}
                      </span>
                      <span>{formatRelative(item.createdAt)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 font-medium leading-tight">
                      <span className="font-semibold text-slate-900 dark:text-white">{item.actor}</span> {item.action}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          GLOBAL SEARCH MODAL (CMD+K / CTRL+K)
      ────────────────────────────────────────────────────────────── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all tenants, assets, staff, tickets..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Body */}
            <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
              {searchQuery.trim().length < 2 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Sparkles className="w-6 h-6 mx-auto text-purple-500 opacity-60" />
                  <p>Type at least 2 characters to search platform-wide</p>
                </div>
              ) : isSearching ? (
                <p className="text-center py-6 text-slate-400">Searching global network...</p>
              ) : (
                <>
                  {/* Organizations Category */}
                  {searchResults?.organizations?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-purple-600" /> Organizations
                      </span>
                      {searchResults.organizations.map((org) => (
                        <div
                          key={org.id}
                          onClick={() => {
                            navigate(org.url);
                            setIsSearchOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{org.title}</span>
                            <span className="text-[11px] text-slate-500">{org.subtitle}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assets Category */}
                  {searchResults?.assets?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                        <Laptop className="w-3 h-3 text-indigo-600" /> Fleet Hardware
                      </span>
                      {searchResults.assets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => {
                            navigate(asset.url);
                            setIsSearchOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{asset.title}</span>
                            <span className="text-[11px] text-slate-500">{asset.subtitle}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tickets Category */}
                  {searchResults?.tickets?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                        <Ticket className="w-3 h-3 text-amber-600" /> Support Tickets
                      </span>
                      {searchResults.tickets.map((tkt) => (
                        <div
                          key={tkt.id}
                          onClick={() => {
                            navigate(tkt.url);
                            setIsSearchOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{tkt.title}</span>
                            <span className="text-[11px] text-slate-500">{tkt.subtitle}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {(!searchResults?.organizations?.length &&
                    !searchResults?.assets?.length &&
                    !searchResults?.tickets?.length) && (
                    <p className="text-center py-6 text-slate-400">
                      No records found matching "{searchQuery}"
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminLayout;
