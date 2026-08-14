import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  Plus,
  UserPlus,
  Edit,
  Boxes,
  Eye,
  MoreVertical,
  Wrench,
  Trash2,
  Download,
  CheckSquare,
  Square,
  X,
  Filter,
  Search,
  Laptop
} from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import DropdownMenu from '../../components/ui/DropdownMenu.jsx';
import HealthScoreBadge from '../../components/ui/HealthScoreBadge.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import { useDashboard } from '../../hooks/useDashboard.js';
import { useAssignments } from '../../hooks/useAssignments.js';
import { assetApi } from '../../api/asset.api.js';
import { assignmentApi } from '../../api/assignment.api.js';
import { formatDate, getAssetHealthScore } from '../../utils/formatters.js';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const AssetInventory = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tbodyRef = useRef(null);
  const { assets, isLoading, createAsset } = useAssets();
  const { categories, employees, locations, vendors } = useDashboard();

  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedAssetForAssign, setSelectedAssetForAssign] = useState(null);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [assetCode, setAssetCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [status, setStatus] = useState('stock');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const openRegisterModal = () => {
    setName('');
    setAssetCode('');
    setCategoryId(categories[0]?._id || '');
    setLocationId(locations[0]?._id || '');
    setVendorId(vendors[0]?._id || '');
    setStatus('stock');
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !assetCode) return;
    setIsSubmitting(true);
    try {
      await createAsset({
        name,
        assetCode,
        categoryId: categoryId || undefined,
        locationId: locationId || undefined,
        vendorId: vendorId || undefined,
        status,
        purchaseDate: new Date().toISOString().split('T')[0]
      });
      setIsRegisterModalOpen(false);
      setName('');
      setAssetCode('');
      toast.success('Hardware asset registered successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Single Assign Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedAssetForAssign) return;
    setIsAssigning(true);
    try {
      await assignmentApi.createAssignment({
        assetId: selectedAssetForAssign._id,
        employeeId: selectedEmployeeId
      });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success(`Asset ${selectedAssetForAssign.assetCode} assigned successfully`);
      setSelectedAssetForAssign(null);
      setSelectedEmployeeId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign asset');
    } finally {
      setIsAssigning(false);
    }
  };

  // Bulk Assign Submit
  const handleBulkAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId || selectedAssetIds.length === 0) return;
    setIsAssigning(true);
    try {
      for (const aId of selectedAssetIds) {
        await assignmentApi.createAssignment({
          assetId: aId,
          employeeId: selectedEmployeeId
        });
      }
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success(`${selectedAssetIds.length} assets assigned successfully`);
      setIsBulkAssignModalOpen(false);
      setSelectedAssetIds([]);
      setSelectedEmployeeId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete bulk assignment');
    } finally {
      setIsAssigning(false);
    }
  };

  // Mark for Repair
  const handleMarkForRepair = async (asset) => {
    try {
      await assetApi.updateStatus(asset._id, 'repair', 'Scheduled maintenance via inventory');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(`${asset.name} marked for repair`);
      setActiveActionMenuId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update asset status');
    }
  };

  // Request Retirement
  const handleRetireAsset = async (asset) => {
    try {
      await assetApi.requestRetirement(asset._id, 'End of life / manager condemned');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(`Retirement requested for ${asset.name}`);
      setActiveActionMenuId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request retirement');
    }
  };

  // Bulk Retire
  const handleBulkRetire = async () => {
    try {
      for (const aId of selectedAssetIds) {
        await assetApi.requestRetirement(aId, 'Bulk retirement request');
      }
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(`Retirement requested for ${selectedAssetIds.length} assets`);
      setSelectedAssetIds([]);
    } catch {
      toast.error('Failed to request bulk retirement');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const dataToExport = selectedAssetIds.length > 0
      ? assets.filter((a) => selectedAssetIds.includes(a._id))
      : assets;

    const headers = ['Asset Code', 'Name', 'Category', 'Status', 'Custodian', 'AI Health Score', 'Purchase Date'];
    const rows = dataToExport.map((a) => [
      `"${a.assetCode || ''}"`,
      `"${a.name || ''}"`,
      `"${a.categoryId?.name || a.categoryName || ''}"`,
      `"${a.status || ''}"`,
      `"${a.currentAssignment?.employeeName || (a.status === 'assigned' ? 'Assigned' : 'Stock')}"`,
      `"${getAssetHealthScore(a)}"`,
      `"${a.purchaseDate ? formatDate(a.purchaseDate) : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AssetOwl_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${dataToExport.length} assets to CSV`);
  };

  // Filter & Search
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchTab = filterTab === 'all' || a.status === filterTab;
      const matchSearch =
        !searchQuery.trim() ||
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.categoryId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [assets, filterTab, searchQuery]);

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
  }, [filteredAssets]);

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAssetIds(filteredAssets.map((a) => a._id));
    } else {
      setSelectedAssetIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = filteredAssets.length > 0 && selectedAssetIds.length === filteredAssets.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
            Hardware Asset Inventory
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
            Complete lifecycle registry with real-time AI degradation tracking, bulk actions, and custodian assignment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={Download}
            onClick={handleExportCSV}
            className="text-xs"
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={openRegisterModal}
            className="text-xs bg-[#6D28D9] hover:bg-purple-700 shadow-purple-600/20"
          >
            Register Asset
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'stock', 'assigned', 'repair', 'retired'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                filterTab === tab
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'all' ? 'All Assets' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, model, category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* Assets Table */}
      {isLoading ? (
        <Card className="p-6 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={Laptop}
          title="No Hardware Assets Found"
          description="No hardware devices match your active filters or search query."
          actionLabel="Register Hardware Asset"
          onAction={openRegisterModal}
        />
      ) : (
        <Card className="p-0 overflow-hidden" hoverLift={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-[#6D28D9] focus:ring-[#6D28D9] cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3.5">Asset Code</th>
                  <th className="px-4 py-3.5">Model Name</th>
                  <th className="px-3 py-3.5">Category</th>
                  <th className="px-3 py-3.5">Custodian</th>
                  <th className="px-3 py-3.5">AI Health</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody ref={tbodyRef} className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAssetIds.includes(asset._id);
                  const score = getAssetHealthScore(asset);

                  return (
                    <tr
                      key={asset._id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-purple-50/50 dark:bg-purple-950/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(asset._id)}
                          className="rounded border-slate-300 text-[#6D28D9] focus:ring-[#6D28D9] cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          onClick={() => navigate(`/assets/${asset._id}`)}
                          className="font-mono text-[#6D28D9] dark:text-purple-300 font-bold cursor-pointer hover:underline"
                        >
                          {asset.assetCode || 'EQ-TAG'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        <span
                          onClick={() => navigate(`/assets/${asset._id}`)}
                          className="hover:text-[#6D28D9] dark:hover:text-purple-400 cursor-pointer"
                        >
                          {asset.name}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 dark:text-slate-300">
                        {asset.categoryId?.name || asset.categoryName || 'Hardware'}
                      </td>
                      <td className="px-3 py-3.5">
                        {asset.currentAssignment?.employeeName || (asset.status === 'assigned' ? 'Assigned Custody' : 'In Stock')}
                      </td>
                      <td className="px-3 py-3.5">
                        <HealthScoreBadge score={score} size="sm" />
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge variant={asset.status} dot>
                          {asset.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <DropdownMenu
                          align="right"
                          menuWidth={180}
                          items={[
                            {
                              label: 'View Details',
                              icon: Eye,
                              onClick: () => navigate(`/assets/${asset._id}`)
                            },
                            {
                              label: 'Assign to Employee',
                              icon: UserPlus,
                              onClick: () => {
                                setSelectedAssetForAssign(asset);
                                setSelectedEmployeeId(employees[0]?._id || '');
                              }
                            },
                            {
                              label: 'Mark for Repair',
                              icon: Wrench,
                              onClick: () => handleMarkForRepair(asset)
                            },
                            {
                              label: 'Request Retirement',
                              icon: Trash2,
                              variant: 'danger',
                              onClick: () => handleRequestRetirement(asset)
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
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FLOATING BULK SELECTION TOOLBAR
      ────────────────────────────────────────────────────────────── */}
      {selectedAssetIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 dark:bg-purple-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 dark:border-purple-800 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
              {selectedAssetIds.length}
            </span>
            <span>Assets Selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedEmployeeId(employees[0]?._id || '');
                setIsBulkAssignModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Bulk Assign</span>
            </button>

            <button
              onClick={handleBulkRetire}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-900/60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Retire</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          <button
            onClick={() => setSelectedAssetIds([])}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            title="Deselect All"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Register Asset Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Hardware Asset"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRegisterSubmit} loading={isSubmitting} className="bg-[#6D28D9] hover:bg-purple-700">
              Register Asset
            </Button>
          </>
        }
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <Input
            label="Asset Model Name"
            required
            placeholder="e.g. MacBook Pro 16 M3 Max"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Asset Code / Tag"
              required
              placeholder="EQ-2024-XXX"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
            />
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={[
                { value: '', label: 'General / No Category' },
                ...categories.map((c) => ({ value: c._id, label: c.name }))
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {locations.length > 0 && (
              <Select
                label="Location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                options={[
                  { value: '', label: 'Select Location' },
                  ...locations.map((l) => ({ value: l._id, label: `${l.name} (${l.code})` }))
                ]}
              />
            )}
            {vendors.length > 0 && (
              <Select
                label="Vendor"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                options={[
                  { value: '', label: 'Select Vendor' },
                  ...vendors.map((v) => ({ value: v._id, label: v.name }))
                ]}
              />
            )}
          </div>
          <Select
            label="Initial Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'stock', label: 'In Available Stock' },
              { value: 'repair', label: 'In Repair' }
            ]}
          />
        </form>
      </Modal>

      {/* Assign Modal (Single) */}
      <Modal
        isOpen={Boolean(selectedAssetForAssign)}
        onClose={() => setSelectedAssetForAssign(null)}
        title={`Assign Asset ${selectedAssetForAssign?.assetCode}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedAssetForAssign(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssignSubmit} loading={isAssigning} className="bg-[#6D28D9] hover:bg-purple-700">
              Confirm Assignment
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Select an active employee to assign custody of <strong>{selectedAssetForAssign?.name}</strong>:
          </p>
          {employees.length === 0 ? (
            <p className="text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded-xl">
              No employees found in directory. Please add an employee first.
            </p>
          ) : (
            <Select
              label="Assign to Employee"
              required
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              options={employees.map((emp) => ({
                value: emp._id,
                label: `${emp.firstName} ${emp.lastName} (${emp.email})`
              }))}
            />
          )}
        </form>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal
        isOpen={isBulkAssignModalOpen}
        onClose={() => setIsBulkAssignModalOpen(false)}
        title={`Bulk Assign (${selectedAssetIds.length} Assets)`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsBulkAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBulkAssignSubmit} loading={isAssigning} className="bg-[#6D28D9] hover:bg-purple-700">
              Assign All {selectedAssetIds.length} Assets
            </Button>
          </>
        }
      >
        <form onSubmit={handleBulkAssignSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Assign custody of all <strong>{selectedAssetIds.length} selected equipment items</strong> to:
          </p>
          <Select
            label="Select Employee Custodian"
            required
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            options={employees.map((emp) => ({
              value: emp._id,
              label: `${emp.firstName} ${emp.lastName} (${emp.email})`
            }))}
          />
        </form>
      </Modal>
    </div>
  );
};

export default AssetInventory;
