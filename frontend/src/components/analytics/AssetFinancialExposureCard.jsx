import React from 'react';
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Clock,
  ShieldAlert,
  HardDrive
} from 'lucide-react';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export const AssetFinancialExposureCard = ({ assetFleet = {} }) => {
  const totalValue = assetFleet.totalFleetValue || 0;
  const replacementExposure = assetFleet.replacementExposureValue || 0;
  const upcomingReplacement = assetFleet.upcomingReplacementValue || 0;

  return (
    <Card hoverLift className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Fleet Financial Exposure & Valuation</CardTitle>
            <CardDescription>Capital asset valuation, depreciation replacement exposure, and 90-day forecast</CardDescription>
          </div>
        </div>
        <Badge variant="emerald">${totalValue.toLocaleString()} Fleet Capital</Badge>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Fleet Capital Value</span>
          <span className="text-xl font-black text-slate-900 dark:text-white">${totalValue.toLocaleString()}</span>
          <p className="text-[10px] text-slate-400">Registered hardware valuation</p>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 space-y-1">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase block">Immediate Replacement Exposure</span>
          <span className="text-xl font-black text-rose-900 dark:text-rose-100">${replacementExposure.toLocaleString()}</span>
          <p className="text-[10px] text-rose-600 dark:text-rose-400">Assets recommended for replacement (&lt;60 health)</p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 space-y-1">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block">Upcoming 90-Day Replacement Value</span>
          <span className="text-xl font-black text-amber-900 dark:text-amber-100">${upcomingReplacement.toLocaleString()}</span>
          <p className="text-[10px] text-amber-600 dark:text-amber-400">Assets reaching end-of-life within 3 months</p>
        </div>
      </div>
    </Card>
  );
};

export default AssetFinancialExposureCard;
