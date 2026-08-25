import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Laptop,
  QrCode,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  History,
  Ticket as TicketIcon,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  RotateCcw,
  Clock,
  Sparkles,
  Camera,
  Save,
  UserMinus,
  Edit3,
  Sliders,
  Cpu,
  HardDrive,
  ExternalLink
} from 'lucide-react';
import { assetApi } from '../../api/asset.api.js';
import { assignmentApi } from '../../api/assignment.api.js';
import { ticketApi } from '../../api/ticket.api.js';
import { dashboardApi } from '../../api/dashboard.api.js';
import useAuthStore from '../../stores/auth.store.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Select from '../../components/ui/Select.jsx';
import Input from '../../components/ui/Input.jsx';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import HealthScoreBadge from '../../components/ui/HealthScoreBadge.jsx';
import AIHealthWidget from '../../components/assets/AIHealthWidget.jsx';
import RaiseTicketModal from '../../components/modals/RaiseTicketModal.jsx';
import ReturnAssetModal from '../../components/modals/ReturnAssetModal.jsx';
import NotFound404 from '../../components/ui/NotFound404.jsx';
import { formatDate, formatRelative, formatCurrency, getAssetHealthScore } from '../../utils/formatters.js';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

export const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const sectionHealthRef = useRef(null);
  const sectionTabsRef = useRef(null);

  const isManager = user?.role === 'asset_manager' || user?.role === 'org_admin' || user?.role === 'super_admin';
  const isAdmin = user?.role === 'org_admin' || user?.role === 'super_admin';
  const isEmployee = user?.role === 'employee';

  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'history' | 'tickets' | 'ai'
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');

  // Editable fields state (for manager)
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyEndDate, setWarrantyEndDate] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [processor, setProcessor] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [os, setOs] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset-detail', id],
    queryFn: () => assetApi.getById(id),
    enabled: Boolean(id)
  });

  const { data: masterData } = useQuery({
    queryKey: ['master-data-asset-detail'],
    queryFn: async () => {
      const [categories, vendors, locations, employees] = await Promise.all([
        dashboardApi.getCategories(),
        dashboardApi.getVendors(),
        dashboardApi.getLocations(),
        dashboardApi.getEmployees()
      ]);
      return { categories, vendors, locations, employees };
    },
    enabled: isManager
  });

  const categories = masterData?.categories || [];
  const vendors = masterData?.vendors || [];
  const locations = masterData?.locations || [];
  const employees = masterData?.employees || [];

  // Populate form on asset load
  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setCategoryId(asset.categoryId?._id || asset.categoryId || '');
      setVendorId(asset.vendorId?._id || asset.vendorId || '');
      setLocationId(asset.locationId?._id || asset.locationId || '');
      setPurchaseDate(asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '');
      setWarrantyEndDate(asset.warrantyEndDate ? asset.warrantyEndDate.split('T')[0] : '');
      setSerialNumber(asset.serialNumber || asset.specifications?.serialNumber || '');
      setProcessor(asset.specifications?.processor || asset.specifications?.cpu || 'Apple M3 Pro / Intel i7');
      setRam(asset.specifications?.ram || '32 GB Unified');
      setStorage(asset.specifications?.storage || '1 TB NVMe SSD');
      setOs(asset.specifications?.os || 'macOS Sonoma / Windows 11 Pro');
    }
  }, [asset]);

  const handleSaveAssetChanges = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      await assetApi.updateAsset(id, {
        name,
        categoryId: categoryId || undefined,
        vendorId: vendorId || undefined,
        locationId: locationId || undefined,
        purchaseDate: purchaseDate || undefined,
        warrantyEndDate: warrantyEndDate || undefined,
        serialNumber: serialNumber || undefined,
        specifications: {
          processor,
          ram,
          storage,
          os,
          serialNumber
        }
      });
      queryClient.invalidateQueries({ queryKey: ['asset-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset details and hardware specifications saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update asset specifications');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassignEmployee = async () => {
    const activeAssignment = asset.assignments?.find((a) => !a.returnedAt);
    if (!activeAssignment) {
      toast.error('No active employee assignment found');
      return;
    }
    if (!confirm(`Release ${asset.name} from current custodian custody back to stock pool?`)) return;

    try {
      await assignmentApi.initiateReturn(activeAssignment._id, 'Unassigned by Asset Manager');
      queryClient.invalidateQueries({ queryKey: ['asset-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset released from employee custody');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign asset');
    }
  };

  const statusMutation = useMutation({
    mutationFn: ({ newStatus, reason }) => assetApi.updateStatus(id, newStatus, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Status change failed');
    }
  });

  const assignMutation = useMutation({
    mutationFn: (empId) => assignmentApi.createAssignment({ assetId: id, employeeId: empId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset assigned successfully');
      setIsAssignModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Assignment failed');
    }
  });

  const retireMutation = useMutation({
    mutationFn: () => assetApi.retireAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset retirement authorized');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Retirement failed');
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: () => assetApi.analyzeAssetHealth(id, true),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['asset-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      const score = data?.healthScore;
      const rec = data?.replacementRecommendation;
      toast.success(`AI Health analysis completed: ${score !== undefined ? `${score}%` : ''} (${rec || 'Updated'})`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'AI analysis failed');
    }
  });

  // GSAP ScrollTrigger for below-the-fold cards
  useEffect(() => {
    const targets = [sectionHealthRef.current, sectionTabsRef.current].filter(Boolean);
    if (targets.length === 0) return;

    const tweens = targets.map((el) =>
      gsap.fromTo(
        el,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%'
          }
        }
      )
    );

    return () => {
      tweens.forEach((t) => {
        t.kill();
        if (t.scrollTrigger) t.scrollTrigger.kill();
      });
      targets.forEach((el) => gsap.set(el, { opacity: 1, y: 0, clearProps: 'all' }));
    };
  }, [asset]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton variant="text" className="h-8 w-48 rounded-xl" />
        <Skeleton variant="rectangular" className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!asset) {
    return (
      <NotFound404
        title="Asset Not Found"
        message="The requested hardware equipment does not exist or has been decommissioned."
        backPath={-1}
      />
    );
  }

  // Warranty Countdown Calculation
  const getWarrantyCountdown = () => {
    const rawDate = asset.warrantyEndDate || asset.warranty?.endDate || (asset.purchaseDate ? new Date(new Date(asset.purchaseDate).setFullYear(new Date(asset.purchaseDate).getFullYear() + 3)) : null);
    if (!rawDate) return { text: 'Standard OEM Coverage', isExpired: false, isUrgent: false, percent: 100, days: 365 };

    const end = new Date(rawDate);
    const now = new Date();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { text: 'Warranty Expired', isExpired: true, isUrgent: false, percent: 0, days: 0 };
    }
    if (diffDays <= 30) {
      return { text: `Warranty Active — Expires in ${diffDays} days`, isExpired: false, isUrgent: true, percent: Math.min(100, (diffDays / 365) * 100), days: diffDays };
    }
    return { text: `Warranty Active — Expires in ${diffDays} days`, isExpired: false, isUrgent: false, percent: Math.min(100, (diffDays / 1095) * 100), days: diffDays };
  };

  const warranty = getWarrantyCountdown();
  const currentCustodian = asset.currentAssignment?.employeeName || (asset.status === 'assigned' ? 'Assigned' : 'In Stock');

  const lifespanMonths = asset.expectedLifespanMonths || asset.categoryId?.expectedLifespanMonths || 36;
  const retirementDate = asset.expectedRetirementDate
    ? new Date(asset.expectedRetirementDate)
    : asset.purchaseDate
    ? new Date(new Date(asset.purchaseDate).setMonth(new Date(asset.purchaseDate).getMonth() + lifespanMonths))
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: isManager ? 'Inventory' : 'My Assets', to: isManager ? '/assets' : '/my-assets' },
          { label: asset.name }
        ]}
      />

      {/* Header Card with Photo / Thumbnail & Status Badges */}
      <div className="p-6 rounded-[12px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-[12px] bg-purple-50 dark:bg-purple-950/70 border border-purple-200/80 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {asset.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover rounded-[12px]"
                />
              ) : (
                <Laptop className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono-code text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-2.5 py-0.5 rounded-[6px] border border-purple-200/80 dark:border-purple-800">
                  {asset.assetCode}
                </span>
                <Badge variant={asset.status}>
                  {asset.status}
                </Badge>
                <HealthScoreBadge score={getAssetHealthScore(asset)} size="sm" />
                {asset.currentAssignment?.employeeName && (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Custodian: {asset.currentAssignment.employeeName}
                  </span>
                )}
              </div>
              <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">
                {asset.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Category: {asset.categoryId?.name || 'Hardware'} • Expected Lifespan: {lifespanMonths} mos
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {isEmployee && (
              <>
                <Button
                  variant="secondary"
                  icon={RotateCcw}
                  onClick={() => setIsReturnModalOpen(true)}
                >
                  Return Asset
                </Button>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setIsTicketModalOpen(true)}
                >
                  Raise Ticket
                </Button>
              </>
            )}

            {isManager && (
              <>
                {asset.status === 'stock' && (
                  <Button
                    variant="primary"
                    icon={User}
                    onClick={() => setIsAssignModalOpen(true)}
                  >
                    Assign to Employee
                  </Button>
                )}

                {asset.status === 'assigned' && (
                  <Button
                    variant="secondary"
                    icon={UserMinus}
                    onClick={handleUnassignEmployee}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50"
                  >
                    Unassign Custodian
                  </Button>
                )}

                {asset.status !== 'retired' && (
                  <div className="w-36">
                    <Select
                      value={asset.status}
                      onChange={(e) =>
                        statusMutation.mutate({ newStatus: e.target.value, reason: 'Manual status update' })
                      }
                      options={[
                        { value: 'stock', label: 'Status: Stock' },
                        { value: 'assigned', label: 'Status: Assigned' },
                        { value: 'repair', label: 'Status: Repair' }
                      ]}
                    />
                  </div>
                )}
              </>
            )}

            {isAdmin && asset.status === 'repair' && (
              <Button
                variant="danger"
                icon={AlertTriangle}
                loading={retireMutation.isPending}
                onClick={() => {
                  if (confirm(`Authorize decommission and retirement for ${asset.name}?`)) {
                    retireMutation.mutate();
                  }
                }}
              >
                Approve Retirement
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* AI Health Widget + Live Warranty Coverage Card */}
      <div ref={sectionHealthRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rich Warranty Card */}
        <div className="p-6 rounded-[12px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Warranty Coverage
            </span>
            <Badge variant={warranty.isExpired ? 'suspended' : warranty.isUrgent ? 'pending' : 'active'}>
              {warranty.isExpired ? 'Expired' : warranty.isUrgent ? 'Expiring Soon' : 'Active'}
            </Badge>
          </div>

          <div
            className={`p-4 rounded-[8px] border space-y-2.5 ${
              warranty.isExpired
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                : warranty.isUrgent
                ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
            }`}
          >
            <div className="flex items-center gap-2">
              {warranty.isExpired ? (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {warranty.text}
              </p>
            </div>

            {!warranty.isExpired && (
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    warranty.isUrgent ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(5, warranty.percent)}%` }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs text-[#475569] dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[#64748B]">Purchase Date:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {asset.purchaseDate ? formatDate(asset.purchaseDate) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[#64748B]">Warranty Expiry:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {asset.warrantyEndDate ? formatDate(asset.warrantyEndDate) : '1 Year Standard'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[#64748B]">Expected Retirement:</span>
              <span className="font-semibold text-purple-700 dark:text-purple-300">
                {retirementDate ? formatDate(retirementDate) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[#64748B]">Coverage Type:</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">
                {asset.warrantyType || 'Manufacturer'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[#64748B]">Vendor / Supplier:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {asset.vendorId?.name || 'OEM Supplier'}
              </span>
            </div>
            <div className="flex justify-between py-1 items-center border-b border-slate-100 dark:border-slate-800">
              <span className="text-[#64748B]">Assigned To:</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>
                  {asset.currentAssignment?.employeeName || (asset.status === 'assigned' ? 'Assigned Employee' : 'Unassigned (In Stock)')}
                </span>
              </span>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-2 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Asset QR Code
              </span>
              <div className="p-2 bg-white rounded-lg shadow-2xs border border-slate-200 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                    `ASSETIQ:${asset.assetCode}:${asset._id}`
                  )}`}
                  alt={`QR Code for ${asset.assetCode}`}
                  className="w-28 h-28 object-contain"
                  loading="lazy"
                />
              </div>
              <span className="font-mono-code text-[10px] font-bold text-purple-700 dark:text-purple-300">
                {asset.assetCode}
              </span>
            </div>
          </div>

          {isManager && (
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/warranties')}
                className="w-full text-xs text-purple-700 dark:text-purple-300"
              >
                Open in Warranty Hub
              </Button>
            </div>
          )}
        </div>

        {/* AI Health Diagnostics Card (Ollama 30-day sparkline) */}
        <div className="lg:col-span-2">
          <AIHealthWidget
            aiData={asset.ai}
            healthHistory={asset.healthHistory}
            onAnalyze={() => analyzeMutation.mutate()}
            isAnalyzing={analyzeMutation.isPending}
            canAnalyze={isManager}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TABBED INTERFACE: SPECIFICATIONS, HISTORY, TICKETS, AI
      ────────────────────────────────────────────────────────────── */}
      <div ref={sectionTabsRef} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        {/* Minimal Tab Header */}
        <div className="flex items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-3">
          {[
            { key: 'specs', label: isManager ? 'Hardware Specs & Editable Configuration' : 'Technical Specifications' },
            { key: 'history', label: `Custody & Maintenance Log (${asset.assignments?.length || 0})` },
            { key: 'tickets', label: `Related Tickets (${asset.tickets?.length || 0})` }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`text-xs font-bold transition-all cursor-pointer relative pb-1 ${
                activeTab === tab.key
                  ? 'text-purple-700 dark:text-purple-300 border-b-2 border-purple-600'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SPECIFICATIONS & EDITABLE FORM */}
        {activeTab === 'specs' && (
          <form onSubmit={handleSaveAssetChanges} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Model / Asset Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isManager}
              />
              <Input
                label="Serial Number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                disabled={!isManager}
              />
              {isManager ? (
                <Select
                  label="Category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={[
                    { value: '', label: 'Select Category' },
                    ...categories.map((c) => ({ value: c._id, label: c.name }))
                  ]}
                />
              ) : (
                <Input label="Category" value={asset.categoryId?.name || 'Hardware'} disabled />
              )}

              <Input
                label="Processor / Chipset"
                value={processor}
                onChange={(e) => setProcessor(e.target.value)}
                disabled={!isManager}
              />
              <Input
                label="Installed Memory (RAM)"
                value={ram}
                onChange={(e) => setRam(e.target.value)}
                disabled={!isManager}
              />
              <Input
                label="Solid State Storage (SSD)"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                disabled={!isManager}
              />

              <Input
                label="Operating System"
                value={os}
                onChange={(e) => setOs(e.target.value)}
                disabled={!isManager}
              />
              <Input
                label="Purchase Date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={!isManager}
              />
              <Input
                label="Warranty Expiry Date"
                type="date"
                value={warrantyEndDate}
                onChange={(e) => setWarrantyEndDate(e.target.value)}
                disabled={!isManager}
              />
            </div>

            {isManager && (
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  loading={isSaving}
                  className="bg-[#6D28D9] hover:bg-purple-700 shadow-purple-600/20"
                >
                  Save Hardware Specifications
                </Button>
              </div>
            )}
          </form>
        )}

        {/* TAB 2: CUSTODY & MAINTENANCE LOG */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {(!asset.assignments || asset.assignments.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No past assignment or maintenance cycles recorded.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {asset.assignments.map((asgn) => {
                  const empName = asgn.employeeId
                    ? `${asgn.employeeId.firstName} ${asgn.employeeId.lastName}`
                    : 'Employee Custodian';
                  const isActive = !asgn.returnedAt;

                  return (
                    <div key={asgn._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {empName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Assigned: {formatDate(asgn.assignedAt)} {asgn.returnedAt && `• Returned: ${formatDate(asgn.returnedAt)}`}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {isActive ? 'Active Custody' : 'Returned & Inspected'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RELATED TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-3">
            {(!asset.tickets || asset.tickets.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Zero service tickets raised for this asset.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {asset.tickets.map((tkt) => (
                  <div
                    key={tkt._id}
                    onClick={() => navigate(`/ticket/${tkt._id}`)}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {tkt.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Category: {tkt.issueType || tkt.type} • Created {formatRelative(tkt.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 capitalize">
                        {tkt.status}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign ${asset.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => assignMutation.mutate(assignEmployeeId)}
              loading={assignMutation.isPending}
              disabled={!assignEmployeeId}
              className="bg-[#6D28D9] hover:bg-purple-700"
            >
              Confirm Assignment
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Select an employee to assign custody of <strong>{asset.name}</strong> ({asset.assetCode}).
          </p>
          <Select
            label="Select Assignee"
            required
            value={assignEmployeeId}
            onChange={(e) => setAssignEmployeeId(e.target.value)}
            options={employees.map((emp) => ({
              value: emp._id,
              label: `${emp.firstName} ${emp.lastName} (${emp.email})`
            }))}
          />
        </div>
      </Modal>

      {/* Unified Raise Ticket Modal */}
      <RaiseTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        preselectedAsset={asset}
      />

      {/* Return Stepper Modal */}
      <ReturnAssetModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        asset={asset}
        assignmentId={asset.assignments?.find((a) => !a.returnedAt)?._id}
      />
    </div>
  );
};

export default AssetDetail;
