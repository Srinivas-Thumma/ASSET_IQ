import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  ExternalLink,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';

export const OrganizationsRequiringAttention = ({ organizations = [] }) => {
  const navigate = useNavigate();

  return (
    <Card hoverLift className="space-y-4" alert={organizations.length > 0}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Organizations Requiring Platform Attention</CardTitle>
            <CardDescription>Tenants flagged with degraded fleet health, ticket backlogs, or quota consumption</CardDescription>
          </div>
        </div>
        <Badge variant={organizations.length > 0 ? 'warning' : 'success'}>
          {organizations.length > 0 ? `${organizations.length} Flagged Tenants` : 'All Systems Nominal'}
        </Badge>
      </div>

      {organizations.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No organizations require intervention</p>
          <p className="text-[11px] text-slate-500 mt-0.5">All customer fleets are operating with healthy SLAs and acceptable quotas.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {organizations.map((org) => (
            <div
              key={org._id || org.slug}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {org.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {org.planName || 'Starter Tier'}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                      org.severity === 'critical'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {org.severity}
                  </span>
                </div>

                {/* Bullet Reasons */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {org.reasons.map((reason, rIdx) => (
                    <span key={rIdx} className="flex items-center gap-1">
                      <span className="text-amber-600 dark:text-amber-400">⚠</span>
                      <span>{reason}</span>
                    </span>
                  ))}
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={ExternalLink}
                onClick={() => navigate(`/admin/organizations/${org._id}`)}
                className="self-start sm:self-auto text-xs shrink-0 text-purple-700 dark:text-purple-300"
              >
                Inspect Tenant
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default OrganizationsRequiringAttention;
