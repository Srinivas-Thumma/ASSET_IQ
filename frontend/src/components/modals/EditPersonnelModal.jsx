import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Wrench,
  Monitor,
  Wifi,
  Power
} from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Badge from '../ui/Badge.jsx';
import { toast } from 'sonner';

export const EditPersonnelModal = ({
  isOpen,
  onClose,
  personnel,
  departments = [],
  onSubmit,
  isSubmitting = false
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState('active');
  const [routingDomains, setRoutingDomains] = useState({
    hardware: false,
    software: false,
    network: false
  });

  useEffect(() => {
    if (personnel) {
      setFirstName(personnel.firstName || '');
      setLastName(personnel.lastName || '');
      setDepartmentId(personnel.departmentId || '');
      setJobTitle(personnel.jobTitle || '');
      setStatus(personnel.status || 'active');

      const domains = personnel.routingDomains || [];
      setRoutingDomains({
        hardware: domains.includes('hardware'),
        software: domains.includes('software'),
        network: domains.includes('network')
      });
    }
  }, [personnel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !jobTitle) {
      toast.error('Please fill in required fields');
      return;
    }

    const selectedDomains = [];
    if (personnel?.role === 'asset_manager') {
      if (routingDomains.hardware) selectedDomains.push('hardware');
      if (routingDomains.software) selectedDomains.push('software');
      if (routingDomains.network) selectedDomains.push('network');
    }

    await onSubmit({
      id: personnel._id,
      data: {
        firstName,
        lastName,
        departmentId: departmentId || null,
        jobTitle,
        status,
        routingDomains: selectedDomains
      }
    });
  };

  if (!personnel) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Personnel: ${personnel.fullName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role & Email Identity Header */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
              Identity & Role
            </span>
            <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {personnel.email}
            </div>
          </div>
          <Badge variant={personnel.role === 'asset_manager' ? 'indigo' : 'blue'}>
            {personnel.role === 'asset_manager' ? 'Asset Manager' : 'Employee'}
          </Badge>
        </div>

        {/* Names Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label="Last Name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Department & Job Title */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={[
              { value: '', label: 'Unassigned / General' },
              ...departments.map((d) => ({ value: d._id, label: d.name }))
            ]}
          />
          <Input
            label="Job Title"
            required
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>

        {/* Account Status Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Account Status
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                status === 'active'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Active</span>
            </button>
            <button
              type="button"
              onClick={() => setStatus('inactive')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                status === 'inactive'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Deactivated</span>
            </button>
          </div>
          {status === 'inactive' && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 font-medium">
              ⚠️ Deactivating will prevent this user from signing in to the platform.
            </p>
          )}
        </div>

        {/* Bonus Field: Asset Manager Ticket Routing Domains */}
        {personnel.role === 'asset_manager' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ticket Routing Domain(s)
            </label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <label
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                  routingDomains.hardware
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={routingDomains.hardware}
                  onChange={(e) => setRoutingDomains({ ...routingDomains, hardware: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Wrench className="w-3.5 h-3.5 text-indigo-500" />
                <span>Hardware</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                  routingDomains.software
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={routingDomains.software}
                  onChange={(e) => setRoutingDomains({ ...routingDomains, software: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                <span>Software</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                  routingDomains.network
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={routingDomains.network}
                  onChange={(e) => setRoutingDomains({ ...routingDomains, network: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                <span>Network</span>
              </label>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default EditPersonnelModal;
