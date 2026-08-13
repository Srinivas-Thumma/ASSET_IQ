import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building,
  Shield,
  Save,
  DollarSign,
  Wrench,
  Monitor,
  Wifi
} from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { personnelApi } from '../../api/personnel.api.js';
import { toast } from 'sonner';

export const Settings = () => {
  const queryClient = useQueryClient();
  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: () => personnelApi.getMyOrganization()
  });

  const [threshold, setThreshold] = useState(2000);

  useEffect(() => {
    if (org?.settings?.autoApproveThreshold) {
      setThreshold(org.settings.autoApproveThreshold);
    }
  }, [org]);

  const handleSave = () => {
    toast.success('Organization settings updated successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Organization Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure organization governance rules, automated approval thresholds, and workspace policies.
        </p>
      </div>

      {/* Organization Profile */}
      <Card title="Organization Identity" subtitle="Primary tenant registration details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <Input
            label="Organization Name"
            value={org?.name || ''}
            disabled
          />
          <Input
            label="Organization Slug / Code"
            value={org?.slug || org?.code || ''}
            disabled
          />
          <Input
            label="Subscription Tier"
            value={org?.planId ? org.planId.toUpperCase() : 'STARTER'}
            disabled
          />
          <Input
            label="Tenant Status"
            value={org?.status ? org.status.toUpperCase() : 'ACTIVE'}
            disabled
          />
        </div>
      </Card>

      {/* Automated Governance Policies */}
      <Card title="Automated Procurement Thresholds" subtitle="Configure value threshold for automatic manager procurement approvals">
        <div className="space-y-4 pt-2">
          <div className="max-w-xs">
            <Input
              label="Auto-Approve Threshold ($ USD)"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hardware requests valued beneath this threshold can be directly fulfilled without requiring multi-tier executive signoff.
          </p>

          <div className="pt-2">
            <Button
              variant="primary"
              icon={Save}
              onClick={handleSave}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
