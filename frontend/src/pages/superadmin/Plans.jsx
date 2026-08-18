import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Shield,
  TrendingUp,
  Users,
  HardDrive,
  BarChart2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2,
  X
} from 'lucide-react';
import adminApi from '../../api/admin.api.js';
import Card, { CardTitle, CardDescription } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { formatDate, formatCurrency } from '../../utils/formatters.js';
import { toast } from 'sonner';

export const Plans = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [expandedAnalyticsId, setExpandedAnalyticsId] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState(99);
  const [maxAssets, setMaxAssets] = useState(200);
  const [maxEmployees, setMaxEmployees] = useState(100);
  const [features, setFeatures] = useState(['Asset Tracking', 'QR Generation', 'Email Support']);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [trialDays, setTrialDays] = useState(14);
  const [visibility, setVisibility] = useState('public');

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: adminApi.getPlans
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingPlan
        ? adminApi.updatePlan(editingPlan._id, data)
        : adminApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success(editingPlan ? 'Tier plan updated' : 'Tier plan created');
      setIsModalOpen(false);
      setEditingPlan(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Tier plan deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    }
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName('');
    setPrice(99);
    setMaxAssets(200);
    setMaxEmployees(100);
    setFeatures(['Asset Monitoring', 'QR Generation', 'Priority Support']);
    setTrialDays(14);
    setVisibility('public');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setName(plan.name || '');
    setPrice(plan.price || 0);
    setMaxAssets(plan.maxAssets || 100);
    setMaxEmployees(plan.maxEmployees || 50);
    setFeatures(plan.features && plan.features.length > 0 ? plan.features : ['Asset Tracking', 'Email Support']);
    setTrialDays(plan.trialDays || 14);
    setVisibility(plan.visibility || 'public');
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (newFeatureInput.trim()) {
      setFeatures([...features, newFeatureInput.trim()]);
      setNewFeatureInput('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    saveMutation.mutate({
      name: name.trim(),
      price: Number(price),
      maxAssets: Number(maxAssets),
      maxEmployees: Number(maxEmployees),
      features,
      trialDays: Number(trialDays),
      visibility
    });
  };

  const totalTenantsAcrossPlans = plans.reduce((acc, p) => acc + (p.subscribersCount ?? p.subscriberCount ?? p.subscribers ?? 0), 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Subscription Plans
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure multi-tenant billing tiers, quota capacities, and enterprise pricing
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleOpenCreate}
        >
          Create New Plan
        </Button>
      </div>

      {/* Grid of Plans */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="text-center py-16">
          <CreditCard className="w-12 h-12 mx-auto text-purple-400 opacity-60 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Subscription Plans Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Create your first billing plan to begin onboarding tenant organizations.</p>
          <Button variant="primary" onClick={handleOpenCreate}>
            Create Plan
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const subscribers = plan.subscribersCount ?? plan.subscriberCount ?? plan.subscribers ?? 0;
            const tenantSharePct = Math.round((subscribers / totalTenantsAcrossPlans) * 100);
            const mrr = subscribers * (plan.price || 0);
            const isExpanded = expandedAnalyticsId === plan._id;

            return (
              <Card
                key={plan._id}
                hoverLift
                className="flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Top Bar: Title & Subscriber Count */}
                  <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>Capacity: Up to {plan.maxAssets} Assets</CardDescription>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#6D28D9] dark:text-purple-300 block">
                        {subscribers} Tenants
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ${mrr}/mo MRR
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="my-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[32px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                        ${plan.price}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        / month per tenant
                      </span>
                    </div>
                  </div>

                  {/* Tenant Share Progress Bar */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 my-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">Tenant Share</span>
                      <span className="text-[#6D28D9] dark:text-purple-400">{tenantSharePct}%</span>
                    </div>
                    <ProgressBar value={subscribers} max={totalTenantsAcrossPlans} colorVariant="purple" />
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 my-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Included Capabilities
                    </span>
                    <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      {(plan.features || []).map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quotas & Trial Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400 font-bold">Max Staff</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{plan.maxEmployees} seats</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400 font-bold">Trial Period</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{plan.trialDays || 14} days</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleOpenEdit(plan)}
                    className="flex-1 text-xs"
                  >
                    Edit Plan
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => {
                      if (window.confirm(`Delete ${plan.name} plan?`)) {
                        deleteMutation.mutate(plan._id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? `Edit ${editingPlan.name} Plan` : 'Create Subscription Plan'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={saveMutation.isPending}
            >
              {editingPlan ? 'Save Changes' : 'Create Plan Tier'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Plan Display Name"
            required
            placeholder="e.g. Enterprise Tier"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (USD / month)"
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="Trial Days"
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Max Asset Hardware Quota"
              type="number"
              required
              value={maxAssets}
              onChange={(e) => setMaxAssets(e.target.value)}
            />
            <Input
              label="Max Staff / Seat Quota"
              type="number"
              required
              value={maxEmployees}
              onChange={(e) => setMaxEmployees(e.target.value)}
            />
          </div>

          {/* Features Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Included Plan Capabilities
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add a plan feature..."
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddFeature}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {features.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300 text-xs border border-purple-100 dark:border-purple-900/60"
                >
                  <span>{f}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-rose-600"
                    onClick={() => handleRemoveFeature(i)}
                  />
                </span>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Plans;
