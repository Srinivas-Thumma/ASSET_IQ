import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Bell,
  Globe,
  Database,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders
} from 'lucide-react';
import Card, { CardTitle, CardDescription, CardContent } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { toast } from 'sonner';

export const SuperAdminSettings = () => {
  const [platformName, setPlatformName] = useState('AssetOwl Multi-Tenant');
  const [supportEmail, setSupportEmail] = useState('support@assetiq.com');
  const [registrationMode, setRegistrationMode] = useState('invite_only');
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('24');
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.assetiq.internal/events');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Platform system configurations updated successfully');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            System Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Global multi-tenant governance, root authentication policies, and security configurations
          </p>
        </div>

        <Button
          variant="primary"
          icon={Save}
          loading={isSaving}
          onClick={handleSave}
        >
          Save Configuration
        </Button>
      </div>

      {/* Settings Cards */}
      <div className="space-y-6">
        {/* General Platform Settings */}
        <Card hoverLift={false}>
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Platform Identification & Routing</CardTitle>
              <CardDescription>Primary instance identity and support escalation channels</CardDescription>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Platform Brand Name"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
            />
            <Input
              label="Root Support Email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
        </Card>

        {/* Security & Access Policies */}
        <Card hoverLift={false}>
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Security & Tenant Governance</CardTitle>
              <CardDescription>Root session duration, tenant onboarding, and MFA enforcement</CardDescription>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tenant Registration Mode"
                value={registrationMode}
                onChange={(e) => setRegistrationMode(e.target.value)}
                options={[
                  { value: 'invite_only', label: 'Invite Only (Admin Approved)' },
                  { value: 'public', label: 'Open Self-Registration' },
                  { value: 'disabled', label: 'Disabled (Closed Platform)' }
                ]}
              />
              <Select
                label="Session Expiration Policy"
                value={sessionTimeoutHours}
                onChange={(e) => setSessionTimeoutHours(e.target.value)}
                options={[
                  { value: '8', label: '8 Hours (High Security)' },
                  { value: '24', label: '24 Hours (Standard)' },
                  { value: '168', label: '7 Days (Extended)' }
                ]}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                  Enforce Two-Factor Authentication (2FA)
                </span>
                <span className="text-xs text-slate-500">
                  Require all Organization Administrators and Super Admins to authenticate with OTP
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMfaEnforced(!mfaEnforced)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  mfaEnforced ? 'bg-[#6D28D9]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    mfaEnforced ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* API & Webhooks */}
        <Card hoverLift={false}>
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Enterprise Event Webhooks</CardTitle>
              <CardDescription>Dispatch real-time telemetry events to external SIEM / SIEM collectors</CardDescription>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Global Event Webhook URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-[11px] text-slate-400">
              Dispatches encrypted payload for events: `org.created`, `asset.health_critical`, `plan.upgraded`.
            </p>
          </div>
        </Card>

        {/* Platform Maintenance Mode */}
        <Card hoverLift={false} className="border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-rose-900 dark:text-rose-200">Platform Maintenance Mode</CardTitle>
                <CardDescription>
                  When enabled, tenants will see a scheduled maintenance banner and read-only mode is active
                </CardDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                maintenanceMode ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
