import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Users,
  Shield,
  Search,
  Power,
  Wrench,
  Monitor,
  Wifi
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import { usePersonnel, useCreatePersonnel, useUpdatePersonnel, useDeletePersonnel } from '../../hooks/usePersonnel.js';
import { useDashboard } from '../../hooks/useDashboard.js';
import AddPersonnelModal from '../../components/modals/AddPersonnelModal.jsx';
import EditPersonnelModal from '../../components/modals/EditPersonnelModal.jsx';
import DeletePersonnelModal from '../../components/modals/DeletePersonnelModal.jsx';
import useAuthStore from '../../stores/auth.store.js';

export const Employees = () => {
  const { user: currentUser } = useAuthStore();
  const { data: personnelList = [], isLoading } = usePersonnel();
  const { departments = [] } = useDashboard();

  const createMutation = useCreatePersonnel();
  const updateMutation = useUpdatePersonnel();
  const deleteMutation = useDeletePersonnel();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'employee' | 'asset_manager'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return personnelList.filter((item) => {
      // Role filter tab
      if (activeTab === 'employee' && item.role !== 'employee') return false;
      if (activeTab === 'asset_manager' && item.role !== 'asset_manager') return false;

      // Search query
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.fullName?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.department?.toLowerCase().includes(term) ||
        item.jobTitle?.toLowerCase().includes(term)
      );
    });
  }, [personnelList, activeTab, searchTerm]);

  const handleCreateSubmit = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      setIsAddOpen(false);
    } catch {
      // Handled in mutation onError
    }
  };

  const handleEditSubmit = async ({ id, data }) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      setEditingItem(null);
    } catch {
      // Handled in mutation onError
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await deleteMutation.mutateAsync(deletingItem._id);
      setDeletingItem(null);
    } catch {
      // Handled in mutation onError
    }
  };

  const handleToggleStatus = async (row) => {
    const nextStatus = row.status === 'active' ? 'inactive' : 'active';
    try {
      await updateMutation.mutateAsync({
        id: row._id,
        data: { status: nextStatus }
      });
    } catch {
      // Handled in mutation onError
    }
  };

  const columns = [
    {
      header: 'Personnel Name',
      accessor: 'fullName',
      className: 'font-semibold text-slate-900 dark:text-white',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="sm" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-white block">
              {row.fullName}
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              {row.jobTitle || 'Team Member'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Work Email',
      accessor: 'email',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-mono-code">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.email}</span>
        </span>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <Badge variant={row.role === 'asset_manager' ? 'indigo' : 'blue'}>
          {row.role === 'asset_manager' ? 'Asset Manager' : 'Employee'}
        </Badge>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          {row.department || 'Unassigned'}
        </span>
      )
    },
    {
      header: 'Routing Domains',
      accessor: 'routingDomains',
      render: (row) => {
        if (row.role !== 'asset_manager' || !row.routingDomains?.length) {
          return <span className="text-xs text-slate-400">—</span>;
        }
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {row.routingDomains.map((dom) => (
              <span
                key={dom}
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center gap-1"
              >
                {dom === 'hardware' && <Wrench className="w-2.5 h-2.5" />}
                {dom === 'software' && <Monitor className="w-2.5 h-2.5" />}
                {dom === 'network' && <Wifi className="w-2.5 h-2.5" />}
                <span>{dom}</span>
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'emerald' : 'slate'}>
          {row.status || 'active'}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs
        items={[
          { label: 'Administration', to: '/dashboard' },
          { label: 'Employees & Managers' }
        ]}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
            Employees & Technical Personnel
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
            Manage organization staff profiles, role privileges, and automated support ticket routing domains.
          </p>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={() => setIsAddOpen(true)}>
          Add Personnel
        </Button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Personnel ({personnelList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('employee')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'employee'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Employees ({personnelList.filter((p) => p.role === 'employee').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('asset_manager')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'asset_manager'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Asset Managers ({personnelList.filter((p) => p.role === 'asset_manager').length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Personnel DataTable */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        searchKey="email"
        actions={(row) => {
          const isSelf = String(row._id) === String(currentUser?._id);
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                icon={Power}
                title={row.status === 'active' ? 'Deactivate account' : 'Activate account'}
                onClick={() => handleToggleStatus(row)}
              />
              <Button
                size="sm"
                variant="ghost"
                icon={Edit}
                title="Edit personnel details"
                onClick={() => setEditingItem(row)}
              />
              {!isSelf && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Trash2}
                  title="Delete personnel"
                  onClick={() => setDeletingItem(row)}
                />
              )}
            </div>
          );
        }}
      />

      {/* Modals */}
      <AddPersonnelModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        departments={departments}
        onSubmit={handleCreateSubmit}
        isSubmitting={createMutation.isPending}
      />

      <EditPersonnelModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        personnel={editingItem}
        departments={departments}
        onSubmit={handleEditSubmit}
        isSubmitting={updateMutation.isPending}
      />

      <DeletePersonnelModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        personnel={deletingItem}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export default Employees;
