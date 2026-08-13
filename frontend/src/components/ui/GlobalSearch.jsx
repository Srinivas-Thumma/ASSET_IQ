import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Building2,
  Laptop,
  Users,
  Ticket,
  ChevronRight,
  Sparkles,
  X,
  ShieldAlert
} from 'lucide-react';
import adminApi from '../../api/admin.api.js';

export const GlobalSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['global-search', searchQuery],
    queryFn: () => adminApi.searchGlobal(searchQuery),
    enabled: searchQuery.trim().length > 1
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all tenants, hardware fleet, staff, tickets... (Ctrl+K)"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
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
              {/* Organizations */}
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
                        onClose();
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

              {/* Assets */}
              {searchResults?.assets?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <Laptop className="w-3 h-3 text-indigo-600" /> Hardware Fleet
                  </span>
                  {searchResults.assets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => {
                        navigate(asset.url);
                        onClose();
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

              {/* Tickets */}
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
                        onClose();
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
  );
};

export default GlobalSearch;
