import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import {
  Building2,
  Plus,
  Power,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  CheckSquare,
  Square,
  X,
  CreditCard,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  ChevronDown,
  Sparkles,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import adminApi from '../../api/admin.api.js';
import KpiCard from '../../components/ui/KpiCard.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import DropdownMenu from '../../components/ui/DropdownMenu.jsx';
import HealthScoreBadge from '../../components/ui/HealthScoreBadge.jsx';
import { formatDate, formatRelative } from '../../utils/formatters.js';
import { toast } from 'sonner';

export const Organizations = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tbodyRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanTab, setSelectedPlanTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [selectedOrgIds, setSelectedOrgIds] = useState([]);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkPlanModalOpen, setIsBulkPlanModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [bulkTargetPlan, setBulkTargetPlan] = useState('professional');

  const [formData, setFormData] = useState({ name: '', slug: '', planId: 'starter' });

  // Data Queries
  const { data: orgs = [], isLoading: isOrgsLoading } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: adminApi.getOrganizations
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: adminApi.getPlans
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: adminApi.createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organization created successfully');
      setIsCreateOpen(false);
      setFormData({ name: '', slug: '', planId: 'starter' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create organization');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organization updated successfully');
      setIsEditOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update organization');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateOrganizationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organization status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organization deleted');
      setIsDeleteModalOpen(false);
      setOrgToDelete(null);
      setSelectedOrgIds((prev) => prev.filter((id) => id !== orgToDelete?._id));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete organization');
    }
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }) => adminApi.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Bulk status updated');
      setSelectedOrgIds([]);
    }
  });

  const bulkPlanMutation = useMutation({
    mutationFn: ({ ids, planId }) => adminApi.bulkUpdatePlan(ids, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Bulk plan updated');
      setIsBulkPlanModalOpen(false);
      setSelectedOrgIds([]);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => adminApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Selected organizations deleted');
      setSelectedOrgIds([]);
    }
  });

  // Calculate aggregates
  const totalMrr = useMemo(() => {
    return orgs.reduce((sum, o) => sum + (o.plan?.priceMonthly || 49), 0);
  }, [orgs]);

  const avgAssetHealth = useMemo(() => {
    if (orgs.length === 0) return 95;
    const scores = orgs.map((o) => o.stats?.avgHealth ?? o.avgHealth ?? o.avgFleetHealth ?? 95);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [orgs]);

  // Filtered Orgs
  const filteredOrgs = useMemo(() => {
    return orgs.filter((org) => {
      const planName = (org.plan?.name || org.plan?.tier || org.planId || 'starter').toLowerCase();
      const isPlanMatch = selectedPlanTab === 'all' || planName.includes(selectedPlanTab.toLowerCase());
      const isStatusMatch = statusFilter === 'all' || org.status === statusFilter;

      const health = org.stats?.avgHealth ?? org.avgHealth ?? org.avgFleetHealth ?? 95;
      let isHealthMatch = true;
      if (healthFilter === 'optimal') isHealthMatch = health >= 80;
      else if (healthFilter === 'fair') isHealthMatch = health >= 60 && health < 80;
      else if (healthFilter === 'degraded') isHealthMatch = health < 60;

      const q = searchTerm.toLowerCase().trim();
      const isSearchMatch =
        !q ||
        org.name?.toLowerCase().includes(q) ||
        org.slug?.toLowerCase().includes(q) ||
        org._id?.toLowerCase().includes(q);

      return isPlanMatch && isStatusMatch && isHealthMatch && isSearchMatch;
    });
  }, [orgs, selectedPlanTab, statusFilter, healthFilter, searchTerm]);

  // GSAP Table Row Stagger Entrance
  useEffect(() => {
    if (!tbodyRef.current) return;
    const rows = tbodyRef.current.querySelectorAll('tr');
    if (!rows || rows.length === 0) return;

    gsap.killTweensOf(rows);
    gsap.fromTo(
      rows,
      { y: 12, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.3,
        stagger: 0.03,
        ease: 'power2.out',
        clearProps: 'all'
      }
    );

    return () => {
      gsap.killTweensOf(rows);
      gsap.set(rows, { opacity: 1, y: 0, clearProps: 'all' });
    };
  }, [filteredOrgs]);

  // Select all toggler
  const handleSelectAll = () => {
    if (selectedOrgIds.length === filteredOrgs.length) {
      setSelectedOrgIds([]);
    } else {
      setSelectedOrgIds(filteredOrgs.map((o) => o._id));
    }
  };

  const handleToggleOrg = (id) => {
    setSelectedOrgIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenEdit = (org) => {
    setEditingOrg(org);
    setFormData({
      name: org.name || '',
      slug: org.slug || '',
      planId: org.plan?._id || org.plan?.tier || org.planId || 'starter'
    });
    setIsEditOpen(true);
  };

  const handleExportCsv = () => {
    if (filteredOrgs.length === 0) {
      toast.error('No tenant data to export');
      return;
    }
    const headers = ['ID', 'Name', 'Slug', 'Plan', 'Status', 'Assets', 'Max Quota', 'Health Score', 'MRR ($)'];
    const rows = filteredOrgs.map((o) => [
      o._id,
      `"${o.name || ''}"`,
      o.slug || '',
      o.plan?.name || o.plan?.tier || o.planId || 'Starter',
      o.status || 'active',
      o.stats?.totalAssets ?? o.assetCount ?? 0,
      o.stats?.maxAssets ?? o.maxAssets ?? 100,
      `${o.stats?.avgHealth ?? o.avgHealth ?? o.avgFleetHealth ?? 95}/100`,
      o.plan?.priceMonthly ?? o.mrr ?? 49
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tenants_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Tenant directory exported to CSV');
  };

  // Plan pill tab options
  const planPills = [
    { key: 'all', label: 'All Plans' },
    { key: 'starter', label: 'Starter' },
    { key: 'pro', label: 'Professional' },
    { key: 'enterprise', label: 'Enterprise' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Tenant Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {orgs.length} Active Tenants · ${totalMrr} MRR · {avgAssetHealth} / 100 Avg Asset Health
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsCreateOpen(true)}
          >
            Create Organization
          </Button>
        </div>
      </div>

      {/* 2. Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Tenants"
          value={isOrgsLoading ? '...' : orgs.length}
          delta="+100%"
          deltaLabel="active platform load"
          isPositive={true}
          icon={Building2}
          trend={[1, 1, 2, 2, 2, orgs.length || 2]}
        />

        <KpiCard
          title="Monthly Recurring Revenue"
          value={isOrgsLoading ? '...' : `$${totalMrr}`}
          delta="+18.2%"
          deltaLabel="predictable ARR"
          isPositive={true}
          icon={CreditCard}
          trend={[49, 49, 98, 98, totalMrr || 98]}
        />

        <KpiCard
          title="Asset Reliability & Health"
          value={`${avgAssetHealth} / 100`}
          delta="Optimal"
          deltaLabel="AI monitored across assets"
          isPositive={avgAssetHealth >= 80}
          icon={Activity}
          trend={[90, 92, 94, 95, avgAssetHealth]}
        />
      </div>

      {/* 3. Filter Bar (Collapsible) */}
      <Card className="p-4 space-y-3" hoverLift={false}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Plan Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {planPills.map((pill) => {
              const isActive = selectedPlanTab === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setSelectedPlanTab(pill.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#6D28D9] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Search Bar + Toggle Details */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, slug, or ID..."
                className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                isFilterCollapsed
                  ? 'bg-purple-50 text-[#6D28D9] border-purple-200 dark:bg-purple-950/60 dark:border-purple-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <ChevronDown className={`w-3 h-3 transition-transform ${isFilterCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible dropdown filters */}
        {isFilterCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs"
          >
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              >
                <option value="all">All Statuses (Active & Suspended)</option>
                <option value="active">Active Tenants Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Asset Health Filter
              </label>
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#6D28D9] focus:outline-none"
              >
                <option value="all">All Reliability Tiers</option>
                <option value="optimal">Optimal (80 - 100)</option>
                <option value="fair">Fair (60 - 79)</option>
                <option value="degraded">Degraded (&lt; 60)</option>
              </select>
            </div>
          </motion.div>
        )}
      </Card>

      {/* 4. Bulk Action Bar (Visible when items selected) */}
      <AnimatePresence>
        {selectedOrgIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between p-3.5 bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 rounded-xl shadow-xs"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6D28D9] dark:text-purple-300">
              <CheckSquare className="w-4 h-4 text-[#6D28D9]" />
              <span>{selectedOrgIds.length} organization(s) selected</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsBulkPlanModalOpen(true)}
              >
                Change Tier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  bulkStatusMutation.mutate({
                    ids: selectedOrgIds,
                    status: 'suspended'
                  })
                }
              >
                Suspend
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => {
                  if (confirm(`Delete ${selectedOrgIds.length} selected organizations permanently?`)) {
                    bulkDeleteMutation.mutate(selectedOrgIds);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Main Organizations Table */}
      <Card className="overflow-hidden border border-slate-200/90 dark:border-slate-800" hoverLift={false}>
        {isOrgsLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No Organizations Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {searchTerm || statusFilter !== 'all' || healthFilter !== 'all' || selectedPlanTab !== 'all'
                ? 'Try adjusting your search criteria or active filters.'
                : 'Get started by provisioning your first tenant organization on the platform.'}
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsCreateOpen(true)}
            >
              Create Organization
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="w-10 p-4">
                    <input
                      type="checkbox"
                      checked={selectedOrgIds.length === filteredOrgs.length && filteredOrgs.length > 0}
                      onChange={handleSelectAll}
                      className="rounded text-[#6D28D9] focus:ring-[#6D28D9] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">Organization</th>
                  <th className="px-3 py-3.5">Slug</th>
                  <th className="px-3 py-3.5">Subscription Plan</th>
                  <th className="px-3 py-3.5">Employees Quota</th>
                  <th className="px-3 py-3.5">Asset Quota</th>
                  <th className="px-3 py-3.5">Asset Health</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5">Last Active</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody ref={tbodyRef} className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrgs.map((org) => {
                  const isSelected = selectedOrgIds.includes(org._id);
                  const isSuspended = org.status === 'suspended';
                  const health = org.stats?.avgHealth ?? org.avgHealth ?? org.avgFleetHealth ?? 95;
                  const totalAssets = org.stats?.totalAssets ?? org.assetCount ?? 0;
                  const maxAssets = org.stats?.maxAssets ?? org.maxAssets ?? org.plan?.maxAssets ?? 100;
                  const totalEmp = org.stats?.totalEmployees ?? org.employeeCount ?? 0;
                  const maxEmp = org.stats?.maxEmployees ?? org.maxEmployees ?? org.plan?.maxEmployees ?? 50;
                  const planName = org.plan?.name || org.plan?.tier || org.planId || 'Starter';

                  return (
                    <tr
                      key={org._id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 ${
                        isSelected ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleOrg(org._id)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500/25 cursor-pointer"
                        />
                      </td>

                      {/* Organization Name + Gradient Avatar + ID */}
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => navigate(`/admin/organizations/${org._id}`)}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {(org.name || 'Org').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors truncate max-w-[180px]">
                              {org.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono-code block truncate max-w-[180px]">
                              ID: {org._id.slice(-8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-3 py-3 font-mono-code text-xs text-purple-600 dark:text-purple-400">
                        {org.slug || '—'}
                      </td>

                      {/* Subscription Plan */}
                      <td className="px-3 py-3">
                        <Badge
                          variant={
                            planName.toLowerCase().includes('enterprise')
                              ? 'purple'
                              : planName.toLowerCase().includes('pro')
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {planName}
                        </Badge>
                      </td>

                      {/* Employees Quota */}
                      <td className="px-3 py-3">
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{totalEmp} / {maxEmp}</span>
                          </div>
                          <ProgressBar value={totalEmp} max={maxEmp} colorVariant="purple" />
                        </div>
                      </td>

                      {/* Asset Quota */}
                      <td className="px-3 py-3">
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{totalAssets} / {maxAssets}</span>
                          </div>
                          <ProgressBar value={totalAssets} max={maxAssets} colorVariant={totalAssets / maxAssets >= 0.8 ? 'amber' : 'purple'} />
                        </div>
                      </td>

                      {/* Asset Health */}
                      <td className="px-3 py-3">
                        <HealthScoreBadge score={health} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <Badge variant={isSuspended ? 'destructive' : 'success'} dot>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </Badge>
                      </td>

                      {/* Last Active */}
                      <td className="px-3 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {formatRelative(org.lastActive || org.updatedAt || org.createdAt)}
                      </td>

                      {/* Three-dot Actions Menu */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu
                          trigger={
                            <button
                              type="button"
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          }
                          items={[
                            {
                              label: 'View Command Profile',
                              icon: Eye,
                              onClick: () => navigate(`/admin/organizations/${org._id}`)
                            },
                            {
                              label: 'Edit Organization Plan',
                              icon: Edit,
                              onClick: () => handleOpenEdit(org)
                            },
                            {
                              label: isSuspended ? 'Activate Tenant' : 'Suspend Tenant',
                              icon: Power,
                              variant: isSuspended ? 'default' : 'danger',
                              onClick: () =>
                                statusMutation.mutate({
                                  id: org._id,
                                  status: isSuspended ? 'active' : 'suspended'
                                })
                            },
                            {
                              label: 'Delete Organization',
                              icon: Trash2,
                              variant: 'danger',
                              divider: true,
                              onClick: () => {
                                setOrgToDelete(org);
                                setIsDeleteModalOpen(true);
                              }
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Organization Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision New Organization"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              loading={createMutation.isPending}
              disabled={!formData.name.trim()}
            >
              Provision Organization
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Organization Name"
            required
            placeholder="e.g. Acme Corp Logistics"
            value={formData.name}
            onChange={(e) => {
              setFormData({
                ...formData,
                name: e.target.value,
                slug: formData.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')
              });
            }}
          />

          <Input
            label="Subdomain / Slug Identifier"
            placeholder="e.g. acme-corp"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          />

          <Select
            label="Subscription Plan Tier"
            value={formData.planId}
            onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
            options={plans.map((p) => ({
              value: p._id || p.tier,
              label: `${p.name} ($${p.priceMonthly}/mo • ${p.maxAssets} Assets)`
            }))}
          />
        </div>
      </Modal>

      {/* Edit Organization Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Organization: ${editingOrg?.name || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (editingOrg) {
                  updateMutation.mutate({ id: editingOrg._id, data: formData });
                }
              }}
              loading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Organization Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          />

          <Select
            label="Assigned Plan"
            value={formData.planId}
            onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
            options={plans.map((p) => ({
              value: p._id || p.tier,
              label: `${p.name} ($${p.priceMonthly}/mo • ${p.maxAssets} Assets)`
            }))}
          />
        </div>
      </Modal>

      {/* Bulk Plan Update Modal */}
      <Modal
        isOpen={isBulkPlanModalOpen}
        onClose={() => setIsBulkPlanModalOpen(false)}
        title="Change Subscription Plan for Selected Organizations"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsBulkPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => bulkPlanMutation.mutate({ ids: selectedOrgIds, planId: bulkTargetPlan })}
              loading={bulkPlanMutation.isPending}
            >
              Apply Plan Update
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Applying this change will update quota limits and MRR tier for {selectedOrgIds.length} selected organizations.
          </p>
          <Select
            label="Target Plan Tier"
            value={bulkTargetPlan}
            onChange={(e) => setBulkTargetPlan(e.target.value)}
            options={plans.map((p) => ({
              value: p._id || p.tier,
              label: `${p.name} ($${p.priceMonthly}/mo • ${p.maxAssets} Assets)`
            }))}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Organization Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (orgToDelete) deleteMutation.mutate(orgToDelete._id);
              }}
              loading={deleteMutation.isPending}
            >
              Delete Tenant
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-xs">
          <p className="text-slate-700 dark:text-slate-200">
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-900 dark:text-white">{orgToDelete?.name}</strong>?
          </p>
          <p className="text-rose-600 font-medium">
            This action cannot be undone. All fleet hardware, department records, and staff allocations will be deleted.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Organizations;
