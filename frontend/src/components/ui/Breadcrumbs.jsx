import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items = [], className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1.5 text-sm mb-4 select-none ${className}`}
    >
      <Link
        to="/"
        className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-1 rounded-md"
        title="Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
            {isLast || !item.to ? (
              <span className="font-semibold text-purple-700 dark:text-purple-300 truncate max-w-[240px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
