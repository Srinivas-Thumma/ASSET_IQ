import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import { TrendingUp } from 'lucide-react';

export const MrrTrendChart = ({
  data = [
    { month: 'Oct', value: 1000 },
    { month: 'Nov', value: 1150 },
    { month: 'Dec', value: 1300 },
    { month: 'Jan', value: 1400 },
    { month: 'Feb', value: 1490 }
  ],
  title = 'Monthly Recurring Revenue (MRR) Velocity',
  subtitle = 'Platform-wide subscription revenue trend',
  growth = '+14.8%'
}) => {
  const containerRef = useRef(null);

  const maxValue = Math.max(...data.map((d) => d.value), 100);

  // GSAP Bar Draw-On Animation
  useEffect(() => {
    if (!containerRef.current) return;
    const bars = containerRef.current.querySelectorAll('.mrr-bar-fill');
    if (!bars || bars.length === 0) return;

    gsap.killTweensOf(bars);
    gsap.fromTo(
      bars,
      { scaleY: 0, transformOrigin: 'bottom' },
      {
        scaleY: 1,
        duration: 0.6,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'transform'
      }
    );

    return () => {
      gsap.killTweensOf(bars);
      gsap.set(bars, { scaleY: 1, clearProps: 'transform' });
    };
  }, [data]);

  return (
    <Card hoverLift className="flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-900/60">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{growth}</span>
        </div>
      </div>

      <div ref={containerRef} className="h-56 w-full pt-4 flex items-end justify-between gap-4 px-2">
        {data.map((item, idx) => {
          const heightPercent = Math.max(10, Math.round((item.value / maxValue) * 100));

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                ${item.value.toLocaleString()}
              </span>
              <div className="w-full max-w-[48px] bg-purple-50 dark:bg-purple-950/40 rounded-t-lg overflow-hidden h-full flex items-end">
                <div
                  className="mrr-bar-fill w-full bg-gradient-to-t from-[#6D28D9] to-purple-500 rounded-t-lg transition-colors hover:brightness-110"
                  style={{ height: `${heightPercent}%`, transformOrigin: 'bottom' }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default MrrTrendChart;
