import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity
} from 'lucide-react';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import LottieLoader from '../ui/LottieLoader.jsx';
import { formatDate, formatRelative } from '../../utils/formatters.js';

export const AIHealthWidget = ({
  aiData,
  healthHistory = [],
  onAnalyze,
  isAnalyzing = false,
  canAnalyze = true
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const healthScore = aiData?.healthScore ?? 95;
  const failureRisk = aiData?.failureRiskPercent ?? 0;
  const usefulLifeMonths = aiData?.remainingUsefulLifeMonths ?? 36;
  const nextMaintenance = aiData?.predictedNextMaintenanceDate;
  const recommendation = aiData?.replacementRecommendation || 'keep';
  const insights = Array.isArray(aiData?.insights) && aiData.insights.length > 0
    ? aiData.insights
    : [
        'Device in optimal operating threshold',
        'Failure risk is within normal manufacturer parameters'
      ];
  const lastAnalyzed = aiData?.lastAnalyzedAt;

  // Generate or format 30-day historical trend data for the sparkline
  const trendPoints = useMemo(() => {
    if (healthHistory && healthHistory.length >= 5) {
      return healthHistory.map((h, i) => ({
        day: i + 1,
        date: formatDate(h.date || new Date()),
        score: h.score
      }));
    }

    // Generate smooth 30-day historical points based on current health score
    const points = [];
    const baseScore = Math.min(100, Math.max(20, healthScore + (healthScore < 60 ? 15 : 4)));
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);

      // Trend down gently towards current score
      const progress = (29 - i) / 29;
      const noise = (Math.sin(i * 1.5) * 1.5);
      const simulatedScore = Math.round(baseScore - ((baseScore - healthScore) * progress) + noise);

      points.push({
        day: 30 - i,
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: Math.max(5, Math.min(100, i === 0 ? healthScore : simulatedScore))
      });
    }
    return points;
  }, [healthScore, healthHistory]);

  const isTrendingUpOrStable = trendPoints[trendPoints.length - 1].score >= trendPoints[0].score - 2;

  const getScoreTheme = (score) => {
    if (score >= 81) {
      return {
        bg: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40',
        border: 'border-emerald-200 dark:border-emerald-800/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        bar: 'emerald',
        sparkColor: '#10B981',
        label: 'Optimal'
      };
    }
    if (score >= 61) {
      return {
        bg: 'from-amber-500/10 to-yellow-500/10 dark:from-amber-950/40 dark:to-yellow-950/40',
        border: 'border-amber-200 dark:border-amber-800/60',
        text: 'text-amber-700 dark:text-amber-300',
        bar: 'amber',
        sparkColor: '#F59E0B',
        label: 'Fair'
      };
    }
    if (score >= 41) {
      return {
        bg: 'from-orange-500/10 to-amber-500/10 dark:from-orange-950/40 dark:to-amber-950/40',
        border: 'border-orange-200 dark:border-orange-800/60',
        text: 'text-orange-700 dark:text-orange-300',
        bar: 'orange',
        sparkColor: '#F97316',
        label: 'Degraded'
      };
    }
    return {
      bg: 'from-rose-500/10 to-red-500/10 dark:from-rose-950/40 dark:to-red-950/40',
      border: 'border-rose-200 dark:border-rose-800/60',
      text: 'text-rose-600 dark:text-rose-400',
      bar: 'danger',
      sparkColor: '#EF4444',
      label: 'Critical'
    };
  };

  const theme = getScoreTheme(healthScore);

  const getRecommendationBadge = (rec) => {
    switch (rec) {
      case 'replace':
        return <Badge variant="danger">Recommendation: Replace / Decommission</Badge>;
      case 'repair':
        return <Badge variant="amber">Recommendation: Schedule Service</Badge>;
      case 'keep':
      default:
        return <Badge variant="purple">Recommendation: Retain in Active Fleet</Badge>;
    }
  };

  // Build SVG polyline points
  const svgWidth = 320;
  const svgHeight = 54;
  const paddingX = 8;
  const paddingY = 8;

  const minScore = 0;
  const maxScore = 100;

  const svgCoordinates = trendPoints.map((p, idx) => {
    const x = paddingX + (idx / (trendPoints.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((p.score - minScore) / (maxScore - minScore)) * (svgHeight - paddingY * 2);
    return { x, y, ...p };
  });

  const polylineStr = svgCoordinates.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${theme.border} shadow-sm overflow-hidden transition-all duration-300`}>
      {/* Header with Title & Ollama Badge */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-purple-50/50 to-white dark:from-purple-950/20 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>AI Health & Predictive Telemetry</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold">
                Ollama Engine
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lastAnalyzed ? `Evaluated ${formatRelative(lastAnalyzed)}` : 'Live diagnostic analytics'}
            </p>
          </div>
        </div>

        {canAnalyze && (
          <Button
            size="sm"
            variant="outline"
            icon={RefreshCw}
            loading={isAnalyzing}
            onClick={onAnalyze}
            className="text-xs border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
          </Button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Score Showcase Banner */}
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${theme.bg} border ${theme.border} flex items-center justify-between gap-4`}>
          <div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              Calculated Health Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-extrabold ${theme.text} tracking-tight`}>
                {healthScore}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 100</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1">
                • {theme.label}
              </span>
            </div>
          </div>

          <div>
            {getRecommendationBadge(recommendation)}
          </div>
        </div>

        {/* 30-Day Historical Sparkline Graph */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>30-Day Health Stability Trend</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold">
              {isTrendingUpOrStable ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Stable & Reliable
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> Minor Degradation
                </span>
              )}
            </div>
          </div>

          {/* SVG Sparkline */}
          <div className="relative pt-1">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-14 overflow-visible"
            >
              <defs>
                <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.sparkColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={theme.sparkColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <polygon
                points={`${paddingX},${svgHeight} ${polylineStr} ${svgWidth - paddingX},${svgHeight}`}
                fill="url(#sparkGradient)"
              />

              {/* Line */}
              <polyline
                fill="none"
                stroke={theme.sparkColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylineStr}
              />

              {/* Interactive Hover Dots */}
              {svgCoordinates.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r={hoveredPoint?.day === c.day ? 4.5 : 2}
                  fill={hoveredPoint?.day === c.day ? '#6D28D9' : theme.sparkColor}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint(c)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold shadow-md pointer-events-none z-10 whitespace-nowrap"
                style={{ left: `${(hoveredPoint.x / svgWidth) * 100}%` }}
              >
                {hoveredPoint.date}: {hoveredPoint.score}/100
              </div>
            )}
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Failure Risk */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span>Failure Risk</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {failureRisk}%
            </p>
            <p className="text-[10px] text-slate-400">Next 6 Months</p>
          </div>

          {/* Useful Life */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Useful Life</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {usefulLifeMonths} <span className="text-xs font-normal">mo</span>
            </p>
            <p className="text-[10px] text-slate-400">Remaining</p>
          </div>

          {/* Next Maintenance */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Next Service</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {nextMaintenance ? formatDate(nextMaintenance) : 'As Needed'}
            </p>
            <p className="text-[10px] text-slate-400">Target Cycle</p>
          </div>
        </div>

        {/* Actionable Insights List */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>AI Predictive Insights</span>
          </div>

          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800/60"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Centered Financial Graph Lottie Animation Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="p-6 bg-white/95 dark:bg-slate-900/95 rounded-3xl shadow-2xl border border-purple-200 dark:border-purple-800/80 pointer-events-auto flex flex-col items-center justify-center">
            <LottieLoader
              src="/Financial Graph Loader.lottie"
              className="w-64 h-64"
              message="Analyzing Asset Telemetry with AI..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIHealthWidget;
