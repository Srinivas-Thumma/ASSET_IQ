import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Skeleton from './Skeleton.jsx';
import EmptyState from './EmptyState.jsx';

export const DataTable = ({
  columns = [],
  data = [],
  onRowClick,
  actions,
  loading = false,
  isLoading = false,
  searchPlaceholder = 'Filter records...',
  searchKey,
  emptyTitle = 'No data available',
  emptyDescription = 'No records match the current criteria.',
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isBusy = loading || isLoading;

  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      if (searchKey && row[searchKey]) {
        return String(row[searchKey]).toLowerCase().includes(term);
      }
      return Object.values(row).some((val) =>
        String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden ${className}`}>
      {/* Table Filter Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
        <div className="relative w-full max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-600 dark:focus:border-purple-400 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredData.length}</span> entries
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800 font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className={`px-5 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              {actions && <th scope="col" className="px-5 py-3.5 text-right w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isBusy ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="even:bg-slate-50/60 dark:even:bg-slate-900/40">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-5 py-4">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              filteredData.map((row, rIdx) => (
                <tr
                  key={row._id || rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`even:bg-slate-50/40 dark:even:bg-slate-900/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors duration-150 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-5 py-3.5 text-sm ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor] ?? '-'}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
