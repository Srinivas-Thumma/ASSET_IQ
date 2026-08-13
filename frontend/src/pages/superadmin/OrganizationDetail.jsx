import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  ArrowLeft,
  Users,
  HardDrive,
  Activity,
  Ticket,
  CreditCard,
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Edit,
  Power,
  Trash2,
  DollarSign,
  Shield,
  Laptop,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import adminApi from '../../api/admin.api.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import HealthScoreBadge from '../../components/ui/HealthScoreBadge.jsx';
import { formatDate, formatRelative, formatCurrency, getAssetHealthScore } from '../../utils/formatters.js';
import { toast } from 'sonner';

export const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'employees' | 'tickets' | 'billing' | 'activity'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', slug: '', planId: 'starter' });

  const { data: org, isLoading } = useQuery({
    queryKey: ['admin-organization-detail', id],
    queryFn: () => adminApi.getOrganizationById(id)
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: adminApi.getPlans
  });

  const updateMutation = useMutation({
    mutationFn: (data) => adminApi.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organization-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organization updated successfully');
      setIsEditModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update organization');
    }
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => adminApi.updateOrganizationStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organization-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organization status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast.success('Organization deleted');
      navigate('/admin/organizations');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete organization');
    }
  });

  const openEditModal = () => {
    if (!org) return;
    setEditFormData({
      name: org.name || '',
      slug: org.slug || '',
      planId: org.planId || 'starter'
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(editFormData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton variant="text" className="h-8 w-48 rounded-xl" />
        <Skeleton variant="rectangular" className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tenant Not Found</h2>
        <p className="text-xs text-slate-500">The requested organization instance does not exist.</p>
        <Button variant="secondary" onClick={() => navigate('/admin/organizations')}>
          Back to Organizations
        </Button>
      </div>
    );
  }

  const isSuspended = org.status === 'suspended';
  const planInfo = org.plan || { name: 'Starter Tier', price: 49, maxEmployees: 50, maxAssets: 100 };
  const stats = org.stats || {
    totalEmployees: org.employees?.length || 0,
    totalAssets: org.assets?.length || 0,
    avgFleetHealth: 92,
    openTickets: org.tickets?.filter((t) => ['open', 'claimed', 'in_progress'].includes(t.status))?.length || 0,
    mrrContribution: planInfo.price || 49,
    maxEmployees: planInfo.maxEmployees || 50,
    maxAssets: planInfo.maxAssets || 100
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Organizations', to: '/admin/organizations' },
          { label: org.name }
        ]}
      />

      {/* Header Profile Card */}
      <div className="p-6 rounded-[12px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-[12px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-2.5 py-0.5 rounded-[6px] border border-purple-200 dark:border-purple-800">
                  {org.slug}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 capitalize">
                  {planInfo.name || org.planId}
                </span>
                <Badge variant={isSuspended ? 'suspended' : 'active'}>
                  {org.status}
                </Badge>
              </div>
              <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">
                {org.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Instance Created {formatDate(org.createdAt)} • Tenant ID: <span className="font-mono">{org._id}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              icon={Edit}
              onClick={openEditModal}
              className="text-xs"
            >
              Edit Tenant
            </Button>

            <Button
              variant="secondary"
              icon={Power}
              onClick={() => statusMutation.mutate(isSuspended ? 'active' : 'suspended')}
              className={`text-xs ${isSuspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
            >
              {isSuspended ? 'Activate Instance' : 'Suspend Instance'}
            </Button>

            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                if (confirm(`Permanently delete ${org.name} and purge all associated assets, employees, and tickets?`)) {
                  deleteMutation.mutate();
                }
              }}
              className="text-xs"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Top KPI Cards (6 Key Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Employees */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-600" /> Employees
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalEmployees} <span className="text-xs font-normal text-slate-400">/ {stats.maxEmployees}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-purple-600 h-full rounded-full"
              style={{ width: `${Math.min(100, (stats.totalEmployees / stats.maxEmployees) * 100)}%` }}
            />
          </div>
        </div>

        {/* Assets */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" /> Fleet Assets
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalAssets} <span className="text-xs font-normal text-slate-400">/ {stats.maxAssets}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${Math.min(100, (stats.totalAssets / stats.maxAssets) * 100)}%` }}
            />
          </div>
        </div>

        {/* Avg Fleet Health */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" /> Avg Fleet Health
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {stats.avgFleetHealth} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
            Optimal • AI Monitored
          </span>
        </div>

        {/* Open Tickets */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 text-amber-600" /> Open Tickets
          </span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {stats.openTickets}
          </div>
          <span className="text-[10px] text-slate-400 block">Active Requests</span>
        </div>

        {/* MRR Contribution */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-purple-600" /> MRR Yield
          </span>
          <div className="text-xl font-extrabold text-purple-700 dark:text-purple-300">
            ${stats.mrrContribution}
          </div>
          <span className="text-[10px] text-slate-400 block">Monthly Recurring</span>
        </div>

        {/* Renewal Date */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" /> Next Renewal
          </span>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {formatDate(org.billing?.renewalDate || stats.renewalDate)}
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
            Auto-Renew Active
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TABBED DRILL-DOWN: FLEET, EMPLOYEES, TICKETS, BILLING, LOGS
      ────────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto">
          {[
            { key: 'fleet', label: `Fleet Assets (${org.assets?.length || 0})`, icon: HardDrive },
            { key: 'employees', label: `Employee Directory (${org.employees?.length || 0})`, icon: Users },
            { key: 'tickets', label: `Support Tickets (${org.tickets?.length || 0})`, icon: Ticket },
            { key: 'billing', label: 'Subscription & Quota', icon: CreditCard },
            { key: 'activity', label: 'Tenant Audit Feed', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-2 pb-1 relative shrink-0 ${
                  isActive
                    ? 'text-purple-700 dark:text-purple-300 border-b-2 border-purple-600'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ────────── TAB 1: FLEET OVERVIEW ────────── */}
        {activeTab === 'fleet' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Asset Code</th>
                  <th className="px-4 py-3">Model Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">AI Health</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(!org.assets || org.assets.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No assets registered in this tenant organization.
                    </td>
                  </tr>
                ) : (
                  org.assets.map((asset) => (
                    <tr key={asset._id} className="hover:bg-purple-50/30 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-purple-700 dark:text-purple-300">
                        {asset.assetCode}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {asset.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {asset.categoryName}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {asset.assignedTo}
                      </td>
                      <td className="px-4 py-3">
                        <HealthScoreBadge score={getAssetHealthScore(asset)} size="sm" />
                      </td>
                      <td className="px-4 py-3 capitalize">
                        <Badge variant={asset.status === 'assigned' ? 'blue' : asset.status === 'stock' ? 'emerald' : 'amber'}>
                          {asset.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/assets/${asset._id}`)}
                          className="text-xs text-purple-600 hover:text-purple-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ────────── TAB 2: EMPLOYEE DIRECTORY ────────── */}
        {activeTab === 'employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-center">Assigned Assets</th>
                  <th className="px-4 py-3 text-center">Tickets Raised</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(!org.employees || org.employees.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No employees created in this organization directory.
                    </td>
                  </tr>
                ) : (
                  org.employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-purple-50/30 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {emp.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {emp.email}
                      </td>
                      <td className="px-4 py-3 capitalize text-purple-600 dark:text-purple-400 font-bold">
                        {emp.role.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {emp.department}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {emp.assignedAssetsCount}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {emp.ticketsRaisedCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ────────── TAB 3: SUPPORT TICKETS ────────── */}
        {activeTab === 'tickets' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Title & Request</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Handler</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Discussion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(!org.tickets || org.tickets.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Zero support tickets recorded for this tenant.
                    </td>
                  </tr>
                ) : (
                  org.tickets.map((tkt) => (
                    <tr key={tkt._id} className="hover:bg-purple-50/30 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-purple-700 dark:text-purple-300">
                        {tkt.ticketCode}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {tkt.title}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-500">
                        {tkt.issueType}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        <Badge variant={tkt.status === 'resolved' ? 'emerald' : tkt.status === 'claimed' ? 'indigo' : 'blue'}>
                          {tkt.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {tkt.assignedAgent}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {formatRelative(tkt.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/ticket/${tkt._id}`)}
                          className="text-xs text-purple-600 hover:text-purple-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Chat</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ────────── TAB 4: SUBSCRIPTION & BILLING ────────── */}
        {activeTab === 'billing' && (
          <div className="space-y-6 text-xs">
            {/* Plan Quota Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Employee Capacity</span>
                  <span className="font-mono text-purple-600 font-bold">
                    {stats.totalEmployees} / {stats.maxEmployees} ({Math.round((stats.totalEmployees / stats.maxEmployees) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (stats.totalEmployees / stats.maxEmployees) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Hardware Fleet Quota</span>
                  <span className="font-mono text-indigo-600 font-bold">
                    {stats.totalAssets} / {stats.maxAssets} ({Math.round((stats.totalAssets / stats.maxAssets) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (stats.totalAssets / stats.maxAssets) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Billing & Invoice History
              </h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Invoice #</th>
                      <th className="px-4 py-2.5">Billing Period</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {org.billing?.invoices?.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 font-mono font-bold text-purple-600">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{formatDate(inv.date)}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">${inv.amount}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="emerald">{inv.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────── TAB 5: ACTIVITY LOG ────────── */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            {(!org.activityLog || org.activityLog.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No audit events recorded for this organization yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {org.activityLog.map((item) => (
                  <div key={item._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="text-slate-900 dark:text-white font-semibold">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{item.actor}</span> ({item.role}) — {item.action.replace(/_/g, ' ')}
                      </p>
                      <span className="text-[10px] text-slate-400">Target Type: {item.targetType}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{formatRelative(item.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Organization Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Tenant: ${org.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} loading={updateMutation.isPending} className="bg-[#6D28D9] hover:bg-purple-700">
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <Input
            label="Organization Name"
            required
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
          />
          <Input
            label="Slug / Domain Prefix"
            required
            value={editFormData.slug}
            onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
          />
          <Select
            label="Subscription Tier"
            value={editFormData.planId}
            onChange={(e) => setEditFormData({ ...editFormData, planId: e.target.value })}
            options={plans.map((p) => ({
              value: p.slug || p._id,
              label: `${p.name} ($${p.price}/mo)`
            }))}
          />
        </form>
      </Modal>
    </div>
  );
};

export default OrganizationDetail;
