import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export const SidebarItem = ({
  icon: Icon,
  label,
  path,
  to,
  active,
  onClick,
  badge,
  badgeVariant = 'indigo',
  isExpanded = false
}) => {
  const targetPath = path || to;
  const location = useLocation();

  const isRouteActive =
    active !== undefined
      ? active
      : location.pathname === targetPath ||
        (targetPath !== '/' &&
          targetPath !== '/dashboard' &&
          location.pathname.startsWith(targetPath));

  return (
    <NavLink
      to={targetPath}
      onClick={onClick}
      title={label}
      className={`flex items-center rounded-xl text-sm transition-all duration-200 relative overflow-hidden h-11 ${
        isExpanded ? 'px-3.5 gap-3 justify-start' : 'px-0 justify-center w-full'
      } ${
        isRouteActive
          ? 'bg-purple-100/90 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 font-semibold shadow-xs border border-purple-200/90 dark:border-purple-800/80'
          : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50/60 dark:hover:bg-slate-800/60 hover:text-purple-700 dark:hover:text-purple-200'
      }`}
    >
      {/* Always visible Icon */}
      <div className="w-6 h-6 flex items-center justify-center shrink-0">
        {Icon && (
          <Icon
            className={`w-5 h-5 transition-colors ${
              isRouteActive
                ? 'text-purple-700 dark:text-purple-300'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          />
        )}
      </div>

      {/* Label and Badge (Visible only when expanded/hovered) */}
      <div
        className={`flex items-center justify-between flex-1 min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ${
          isExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 pointer-events-none'
        }`}
      >
        <span className="truncate">{label}</span>

        {badge !== undefined && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${
              badgeVariant === 'danger'
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                : badgeVariant === 'warning'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400'
                : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </NavLink>
  );
};

export default SidebarItem;
