import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Laptop,
  RotateCcw,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Download,
  Eye,
  Calendar,
  AlertTriangle,
  Monitor,
  Smartphone,
  Server
} from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ReturnAssetModal from '../../components/modals/ReturnAssetModal.jsx';
import RaiseTicketModal from '../../components/modals/RaiseTicketModal.jsx';
import HealthScoreBadge from '../../components/ui/HealthScoreBadge.jsx';
import { useAssets } from '../../hooks/useAssets.js';
import { getAssetHealthScore } from '../../utils/formatters.js';
import { toast } from 'sonner';

export const MyAssets = () => {
  const navigate = useNavigate();
  const { myAssets, isMyAssetsLoading } = useAssets();

  const [returnAsset, setReturnAsset] = useState(null);
  const [ticketAsset, setTicketAsset] = useState(null);

  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('laptop') || name.includes('macbook')) return Laptop;
    if (name.includes('monitor') || name.includes('screen')) return Monitor;
    if (name.includes('phone') || name.includes('mobile')) return Smartphone;
    if (name.includes('server') || name.includes('network')) return Server;
    return Laptop;
  };

  const getWarrantyInfo = (warrantyEndDate) => {
    if (!warrantyEndDate) {
      return { text: 'Active Coverage', isExpired: false, isUrgent: false };
    }
    const end = new Date(warrantyEndDate);
    const now = new Date();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { text: 'Warranty Expired', isExpired: true, isUrgent: false };
    }
    if (diffDays <= 30) {
      return { text: `Expires in ${diffDays} days`, isExpired: false, isUrgent: true };
    }
    return { text: `Active — Expires in ${diffDays} days`, isExpired: false, isUrgent: false };
  };

  const handleDownloadQr = (e, asset) => {
    e.stopPropagation();
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" width="300" height="340">
      <rect width="300" height="340" rx="16" fill="#0f172a" />
      <rect x="20" y="20" width="260" height="260" rx="12" fill="#ffffff" />
      <rect x="40" y="40" width="60" height="60" rx="6" fill="#6d28d9" />
      <rect x="52" y="52" width="36" height="36" rx="3" fill="#ffffff" />
      <rect x="60" y="60" width="20" height="20" fill="#6d28d9" />
      <rect x="200" y="40" width="60" height="60" rx="6" fill="#6d28d9" />
      <rect x="212" y="52" width="36" height="36" rx="3" fill="#ffffff" />
      <rect x="220" y="60" width="20" height="20" fill="#6d28d9" />
      <rect x="40" y="200" width="60" height="60" rx="6" fill="#6d28d9" />
      <rect x="52" y="212" width="36" height="36" rx="3" fill="#ffffff" />
      <rect x="60" y="220" width="20" height="20" fill="#6d28d9" />
      <rect x="120" y="50" width="16" height="16" fill="#0f172a" />
      <rect x="150" y="50" width="16" height="16" fill="#0f172a" />
      <rect x="120" y="80" width="30" height="16" fill="#0f172a" />
      <rect x="165" y="80" width="16" height="30" fill="#0f172a" />
      <rect x="50" y="120" width="16" height="30" fill="#0f172a" />
      <rect x="80" y="120" width="30" height="16" fill="#0f172a" />
      <rect x="125" y="125" width="50" height="50" rx="8" fill="#6d28d9" />
      <circle cx="150" cy="150" r="14" fill="#ffffff" />
      <rect x="200" y="125" width="20" height="40" fill="#0f172a" />
      <rect x="235" y="140" width="25" height="25" fill="#0f172a" />
      <rect x="120" y="190" width="40" height="16" fill="#0f172a" />
      <rect x="180" y="190" width="16" height="40" fill="#0f172a" />
      <rect x="210" y="210" width="50" height="16" fill="#0f172a" />
      <rect x="130" y="220" width="30" height="40" fill="#0f172a" />
      <text x="150" y="305" fill="#ffffff" font-size="14" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">${asset.assetCode}</text>
      <text x="150" y="324" fill="#a78bfa" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">AssetOwl Smart Tag</text>
    </svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${asset.assetCode}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded QR tag for ${asset.assetCode}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#1E293B] dark:text-white tracking-tight mb-2">
          My Assigned Equipment & Devices
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mb-6">
          Laptops, workstations, and company hardware currently assigned to your custody.
        </p>
      </div>

      {/* Grid of Asset Cards */}
      {isMyAssetsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton variant="rectangular" className="h-64 rounded-2xl" />
          <Skeleton variant="rectangular" className="h-64 rounded-2xl" />
          <Skeleton variant="rectangular" className="h-64 rounded-2xl" />
        </div>
      ) : myAssets.length === 0 ? (
        <EmptyState
          icon={Laptop}
          title="No assets assigned yet"
          description="You do not have any company hardware currently in your custody. Contact IT support to request equipment."
          actionLabel="Request Equipment"
          onAction={() => navigate('/my-tickets')}
          className="mt-6"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {myAssets.map((asset) => {
            const IconComponent = getCategoryIcon(asset.categoryId?.name);
            const warranty = getWarrantyInfo(asset.warrantyEndDate || asset.warranty?.endDate);
            const health = getAssetHealthScore(asset);

            return (
              <div
                key={asset._id}
                onClick={() => navigate(`/assets/${asset._id}`)}
                className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/80 hover:shadow-md hover:shadow-purple-500/5 transition-all cursor-pointer group"
              >
                <div>
                  {/* Top: Photo/Icon Thumbnail + Name + Code + Badges */}
                  <div className="flex items-start gap-3">
                    {/* Thumbnail: photo or fallback icon */}
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      {asset.imageUrl ? (
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <IconComponent className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {asset.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono-code text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-2 py-0.2 rounded-lg border border-purple-200/80 dark:border-purple-800">
                          {asset.assetCode}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                          {asset.status}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      title="Download Smart QR Tag"
                      onClick={(e) => handleDownloadQr(e, asset)}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* AI Health Progress Indicator */}
                  <div className="mt-4 p-3 rounded-xl bg-purple-50/40 dark:bg-slate-800/40 border border-purple-100/70 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-purple-200 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>AI Health Condition</span>
                      </span>
                      <HealthScoreBadge score={health} size="sm" />
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          health > 80
                            ? 'bg-purple-600'
                            : health > 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${health}%` }}
                      />
                    </div>
                  </div>

                  {/* Warranty Countdown */}
                  <div className="mt-3 flex items-center justify-between text-xs px-1">
                    <span className="text-slate-400">Coverage:</span>
                    <span
                      className={`font-semibold flex items-center gap-1 text-[11px] ${
                        warranty.isExpired
                          ? 'text-rose-600 dark:text-rose-400'
                          : warranty.isUrgent
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {warranty.isExpired ? (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{warranty.text}</span>
                    </span>
                  </div>
                </div>

                {/* Actions: Return & Raise Ticket */}
                <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={RotateCcw}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReturnAsset(asset);
                    }}
                    className="text-xs h-[34px]"
                  >
                    Return
                  </Button>

                  <Button
                    size="sm"
                    variant="primary"
                    icon={Plus}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTicketAsset(asset);
                    }}
                    className="text-xs h-[34px]"
                  >
                    Raise Ticket
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Stepper Modal */}
      {returnAsset && (
        <ReturnAssetModal
          isOpen={Boolean(returnAsset)}
          onClose={() => setReturnAsset(null)}
          asset={returnAsset}
          assignmentId={returnAsset.assignmentId || returnAsset._id}
        />
      )}

      {/* Unified Raise Ticket Modal */}
      {ticketAsset && (
        <RaiseTicketModal
          isOpen={Boolean(ticketAsset)}
          onClose={() => setTicketAsset(null)}
          preselectedAsset={ticketAsset}
          userAssets={myAssets}
        />
      )}
    </div>
  );
};

export default MyAssets;
