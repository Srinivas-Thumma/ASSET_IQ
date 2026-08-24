import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Laptop,
  Ticket,
  Boxes,
  ClipboardCheck,
  LayoutDashboard,
  AlertTriangle,
  ShoppingCart,
  Trash2,
  MapPin,
  Building2,
  Tag,
  Truck,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  CreditCard,
  LifeBuoy
} from 'lucide-react';
import SidebarItem from '../ui/SidebarItem.jsx';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { useAuthStore } from '../../stores/auth.store.js';
import { useUiStore } from '../../stores/ui.store.js';
import { useExceptionCounts } from '../../hooks/useDashboard.js';
import { ROLES } from '../../utils/constants.js';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { sidebarOpen } = useUiStore();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const role = user?.role || ROLES.EMPLOYEE;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isOrgAdmin = role === ROLES.ORG_ADMIN;

  const isExpanded = isHovered || sidebarOpen;

  const { data: counts } = useExceptionCounts({ enabled: Boolean(isOrgAdmin) });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed lg:static top-0 left-0 z-40 h-screen flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col justify-between ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        isExpanded ? 'w-64 shadow-2xl lg:shadow-none' : 'w-20'
      }`}
    >
      {/* Top Fixed Logo */}
      <div className={`flex items-center h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 transition-all duration-300 ${
        isExpanded ? 'px-4 gap-3' : 'px-0 justify-center'
      }`}>
        <img
          src="/logo.png"
          alt="AssetOwl Logo"
          className="w-9 h-9 rounded-xl object-contain shrink-0 shadow-xs shadow-purple-600/20"
        />
        <div
          className={`flex items-center gap-1.5 overflow-hidden whitespace-nowrap transition-all duration-300 ${
            isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 pointer-events-none'
          }`}
        >
          <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
            AssetOwl
          </span>
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
            v2
          </span>
        </div>
      </div>

      {/* Middle Navigation Items (Scrolls independently if many items) */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1 overflow-x-hidden">
        {/* EMPLOYEE ONLY */}
        {role === ROLES.EMPLOYEE && (
          <>
            <SidebarItem
              path="/my-assets"
              icon={Laptop}
              label="My Assets"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/my-tickets"
              icon={Ticket}
              label="My Tickets"
              isExpanded={isExpanded}
            />
          </>
        )}

        {/* ASSET MANAGER ONLY */}
        {role === ROLES.ASSET_MANAGER && (
          <>
            <SidebarItem
              path="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/tickets"
              icon={Ticket}
              label="Ticket Queue"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/assets"
              icon={Boxes}
              label="Asset Inventory"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/warranties"
              icon={ShieldCheck}
              label="Warranty Hub"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/inspections"
              icon={ClipboardCheck}
              label="Inspections"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/my-tickets"
              icon={Ticket}
              label="My Tickets"
              isExpanded={isExpanded}
            />
          </>
        )}

        {/* SUPER ADMIN ONLY */}
        {isSuperAdmin && (
          <>
            <SidebarItem
              path="/admin/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/admin/organizations"
              icon={Building2}
              label="Organizations"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/admin/plans"
              icon={CreditCard}
              label="Subscription Plans"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/admin/analytics"
              icon={BarChart3}
              label="Global Analytics"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/admin/support"
              icon={LifeBuoy}
              label="Platform Support"
              isExpanded={isExpanded}
            />

            {/* SETTINGS */}
            <div className="pt-3 pb-1">
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
            </div>
            <SidebarItem
              path="/admin/settings"
              icon={Settings}
              label="System Settings"
              isExpanded={isExpanded}
            />
          </>
        )}

        {/* ORG ADMIN ONLY (Strict oversight & governance layout) */}
        {isOrgAdmin && (
          <>
            <SidebarItem
              path="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              isExpanded={isExpanded}
            />

            {/* APPROVALS SECTION */}
            <div
              className={`pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider overflow-hidden whitespace-nowrap transition-all duration-300 ${
                isExpanded ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 py-0'
              }`}
            >
              Approvals
            </div>
            <SidebarItem
              path="/procurement"
              icon={ShoppingCart}
              label="Procurement"
              badge={counts?.pendingProcurementCount > 0 ? counts.pendingProcurementCount : undefined}
              badgeVariant="indigo"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/retirements"
              icon={Trash2}
              label="Retirements"
              badge={counts?.pendingRetirementCount > 0 ? counts.pendingRetirementCount : undefined}
              badgeVariant="danger"
              isExpanded={isExpanded}
            />

            {/* OPERATIONS SECTION */}
            <div
              className={`pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider overflow-hidden whitespace-nowrap transition-all duration-300 ${
                isExpanded ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 py-0'
              }`}
            >
              Operations
            </div>
            <SidebarItem
              path="/tickets"
              icon={Ticket}
              label="Ticket Help Desk"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/my-tickets"
              icon={Ticket}
              label="My Requests"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/warranties"
              icon={ShieldCheck}
              label="Warranty Hub"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/exceptions"
              icon={AlertTriangle}
              label="Exceptions"
              badge={counts?.totalExceptions > 0 ? counts.totalExceptions : undefined}
              badgeVariant="warning"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/reports"
              icon={BarChart3}
              label="Reports & Analytics"
              isExpanded={isExpanded}
            />

            {/* REGISTRY SECTION */}
            <div
              className={`pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider overflow-hidden whitespace-nowrap transition-all duration-300 ${
                isExpanded ? 'opacity-100 max-h-8' : 'opacity-0 max-h-0 py-0'
              }`}
            >
              Registry
            </div>
            <SidebarItem
              path="/employees"
              icon={Users}
              label="Employees & Managers"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/departments"
              icon={Building2}
              label="Departments"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/categories"
              icon={Tag}
              label="Categories"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/locations"
              icon={MapPin}
              label="Locations"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/vendors"
              icon={Truck}
              label="Vendors"
              isExpanded={isExpanded}
            />

            {/* SUPPORT & SETTINGS */}
            <div className="pt-3 pb-1">
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
            </div>
            <SidebarItem
              path="/platform-support"
              icon={LifeBuoy}
              label="Platform Support"
              isExpanded={isExpanded}
            />
            <SidebarItem
              path="/settings"
              icon={Settings}
              label="Settings"
              isExpanded={isExpanded}
            />
          </>
        )}
      </div>

      {/* Bottom Fixed User Profile Card (Always visible at bottom) */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 shrink-0">
        <div className={`flex items-center transition-all duration-300 ${
          isExpanded ? 'gap-3 justify-between' : 'justify-center'
        }`}>
          <div className="shrink-0 flex items-center justify-center">
            <Avatar name={user?.name || user?.email || 'User'} size="md" />
          </div>
          <div
            className={`flex-1 min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ${
              isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 pointer-events-none'
            }`}
          >
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user?.name || user?.email || 'User'}
            </p>
            <div className="mt-0.5">
              <Badge size="sm" variant={role === ROLES.EMPLOYEE ? 'blue' : role === ROLES.ASSET_MANAGER ? 'indigo' : 'purple'}>
                {role === ROLES.SUPER_ADMIN ? 'Root Super Admin' : role?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          {isExpanded && (
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
