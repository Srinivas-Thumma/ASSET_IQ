import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Laptop,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  X,
  LifeBuoy
} from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import { useTickets } from '../../hooks/useTickets.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { toast } from 'sonner';

export const RaiseTicketModal = ({
  isOpen,
  onClose,
  preselectedAsset = null,
  userAssets = []
}) => {
  const { createTicket } = useTickets();
  const { user } = useAuthStore();
  const isAdminOrManager = user?.role === 'org_admin' || user?.role === 'asset_manager';

  const [assetId, setAssetId] = useState('');
  const [type, setType] = useState('repair');
  const [issueCategory, setIssueCategory] = useState('hardware');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [supportMode, setSupportMode] = useState('it'); // 'it' | 'admin'

  useEffect(() => {
    if (preselectedAsset) {
      setAssetId(preselectedAsset._id || preselectedAsset.id || '');
    } else if (userAssets.length > 0 && !assetId) {
      setAssetId(userAssets[0]._id);
    }
  }, [preselectedAsset, userAssets, isOpen]);

  const resetForm = () => {
    if (!preselectedAsset) setAssetId('');
    setSupportMode('it');
    setType('repair');
    setIssueCategory('hardware');
    setTitle('');
    setDescription('');
  };

  const handleModeChange = (mode) => {
    setSupportMode(mode);
    if (mode === 'admin') {
      setType('admin_support');
      setIssueCategory('billing');
    } else {
      setType('repair');
      setIssueCategory('hardware');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please provide a ticket title and description');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTicket({
        assetId: supportMode === 'it' && assetId ? assetId : undefined,
        type: supportMode === 'admin' ? 'admin_support' : type,
        issueType: issueCategory,
        title: title.trim(),
        description: description.trim()
      });
      toast.success(
        supportMode === 'admin'
          ? 'Admin support request submitted to Super Admin queue'
          : 'Support ticket submitted. IT team will triage and assign priority'
      );
      resetForm();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const assetOptions = [
    { value: '', label: 'General / No specific hardware asset' },
    ...userAssets.map((a) => ({
      value: a._id,
      label: `${a.name} (${a.assetCode || 'Asset'})`
    }))
  ];

  const itTypeOptions = [
    { value: 'repair', label: 'Hardware Repair' },
    { value: 'support', label: 'Technical Support' },
    { value: 'return', label: 'Equipment Return' }
  ];

  const categoryOptions =
    supportMode === 'admin'
      ? [
          { value: 'billing', label: 'Billing & Invoices' },
          { value: 'plan_upgrade', label: 'Plan Upgrade Request' },
          { value: 'policy', label: 'Policy & Compliance Question' },
          { value: 'technical', label: 'Technical Platform Issue' },
          { value: 'other', label: 'General Admin Inquiry' }
        ]
      : [
          { value: 'hardware', label: 'Hardware / Physical' },
          { value: 'software', label: 'Software / OS' },
          { value: 'network', label: 'Network & Access' },
          { value: 'accessory', label: 'Accessories / Peripherals' },
          { value: 'other', label: 'Other Inquiries' }
        ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={supportMode === 'admin' ? 'Raise Admin Support Request' : 'Raise Support Ticket'}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!title.trim() || !description.trim()}
          >
            Submit Request
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Org Admin / Asset Manager: Toggle IT Support vs Admin Support */}
        {isAdminOrManager && !preselectedAsset && (
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => handleModeChange('it')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                supportMode === 'it'
                  ? 'bg-white dark:bg-slate-900 text-[#6D28D9] dark:text-purple-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              IT Support (Internal)
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('admin')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                supportMode === 'admin'
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Admin Support (Super Admin)
            </button>
          </div>
        )}

        {/* If Opened from Asset Details: Show read-only locked chip */}
        {preselectedAsset ? (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase block">
                  Target Asset Context
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  {preselectedAsset.name} {preselectedAsset.assetCode ? `(${preselectedAsset.assetCode})` : ''}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
              Locked
            </span>
          </div>
        ) : supportMode === 'it' ? (
          /* Related Asset Dropdown */
          <Select
            label="Related Equipment / Asset"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            options={assetOptions}
          />
        ) : null}

        {/* Request Type & Issue Category */}
        <div className="grid grid-cols-2 gap-3">
          {supportMode === 'it' ? (
            <Select
              label="Request Type"
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={itTypeOptions}
            />
          ) : (
            <Input
              label="Support Queue"
              value="Super Admin Escalations"
              disabled
            />
          )}

          <Select
            label={supportMode === 'admin' ? 'Support Category' : 'Issue Category'}
            required
            value={issueCategory}
            onChange={(e) => setIssueCategory(e.target.value)}
            options={categoryOptions}
          />
        </div>

        {/* Title */}
        <Input
          label="Ticket Summary / Subject"
          required
          placeholder={
            type === 'admin_support'
              ? 'e.g. Plan upgrade request for 100 new seats'
              : 'e.g. Battery drains rapidly or screen flickering'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200 mb-1.5">
            Issue Details <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="Please describe symptoms, steps to reproduce, or required support details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-purple-100 text-xs focus:ring-4 focus:ring-purple-500/15 focus:border-purple-600 focus:outline-none"
          />
        </div>
      </form>
    </Modal>
  );
};

export default RaiseTicketModal;
