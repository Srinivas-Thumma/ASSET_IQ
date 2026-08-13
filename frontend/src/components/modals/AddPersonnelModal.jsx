import React, { useState } from 'react';
import {
  User,
  Shield,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Wrench,
  Monitor,
  Wifi
} from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import { toast } from 'sonner';

export const AddPersonnelModal = ({
  isOpen,
  onClose,
  departments = [],
  onSubmit,
  isSubmitting = false
}) => {
  const [activeTab, setActiveTab] = useState('employee'); // 'employee' | 'asset_manager'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [copied, setCopied] = useState(false);

  // Asset Manager Ticket Routing Domains
  const [routingDomains, setRoutingDomains] = useState({
    hardware: false,
    software: false,
    network: false
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setDepartmentId(departments[0]?._id || '');
    setJobTitle('');
    setRoutingDomains({ hardware: false, software: false, network: false });
    setCopied(false);
  };

  const handleTabSwitch = (newTab) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
  };

  const generatePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%^&*';
    let pwd = '';
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += symbols[Math.floor(Math.random() * symbols.length)];
    const all = upper + lower + digits + symbols;
    for (let i = 0; i < 8; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    const shuffled = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    setPassword(shuffled);
    setShowPassword(true);
    toast.success('Generated secure password');
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !departmentId || !jobTitle) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedDomains = [];
    if (activeTab === 'asset_manager') {
      if (routingDomains.hardware) selectedDomains.push('hardware');
      if (routingDomains.software) selectedDomains.push('software');
      if (routingDomains.network) selectedDomains.push('network');
    }

    try {
      await onSubmit({
        firstName,
        lastName,
        email,
        password: password || undefined,
        departmentId,
        jobTitle,
        role: activeTab,
        routingDomains: selectedDomains
      });
      resetForm();
    } catch {
      // Error is surfaced via toast notification in usePersonnel
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Add Organization Personnel"
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
          >
            Create {activeTab === 'employee' ? 'Employee' : 'Asset Manager'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => handleTabSwitch('employee')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'employee'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Standard Employee</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('asset_manager')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'asset_manager'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Asset Manager</span>
          </button>
        </div>

        {/* Role Description Note */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
          {activeTab === 'employee'
            ? 'Employees have standard workspace access to request hardware, view assigned devices, and submit repair tickets.'
            : 'Asset Managers have elevated privileges to fulfill tickets, perform asset inspections, register new inventory, and manage custody.'}
        </p>

        {/* Names Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            required
            placeholder="Jane"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label="Last Name"
            required
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Work Email */}
        <Input
          label="Work Email Address"
          type="email"
          required
          placeholder="jane.doe@organization.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Department & Job Title */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Department"
            required
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={[
              { value: '', label: 'Select Department' },
              ...departments.map((d) => ({ value: d._id, label: d.name }))
            ]}
          />
          <Input
            label="Job Title"
            required
            placeholder={activeTab === 'employee' ? 'e.g. Software Engineer' : 'e.g. IT Lead'}
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>

        {/* Password Setup */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Account Password <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <button
              type="button"
              onClick={generatePassword}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-Generate</span>
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Leave empty to auto-generate"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-3 pr-20 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
              {password && (
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  title="Copy Password"
                  className="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            If left blank, a secure 12-character password will be created and shown in a toast alert.
          </p>
        </div>

        {/* Bonus Field: Asset Manager Ticket Routing Domains */}
        {activeTab === 'asset_manager' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Default Ticket Routing Domain(s)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select which issue categories should automatically route to this manager:
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Hardware */}
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

              {/* Software */}
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

              {/* Network */}
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

export default AddPersonnelModal;
