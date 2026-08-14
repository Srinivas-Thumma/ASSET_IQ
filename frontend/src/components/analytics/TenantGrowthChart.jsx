import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import Card, { CardTitle, CardDescription } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export const TenantGrowthChart = ({
  data = [
    { period: 'Q1', count: 1 },
    { period: 'Q2', count: 2 },
    { period: 'Q3', count: 3 },
    { period: 'Q4', count: 4 },
    { period: 'Now', count: 6 }
  ],
  title = 'Tenant Growth Trajectory',
  subtitle = 'Enterprise customer acquisition cadence'
}) => {
  const pathRef = useRef(null);
  const areaRef = useRef(null);

  // Generate SVG path points
  const max = Math.max(...data.map((d) => d.count), 1);
  const width = 500;
  const height = 180;
  const padding = 20;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.count / max) * (height - padding * 2);
    return { x, y, ...d };
  });

  const linePathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaPathD = `${linePathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  // GSAP Line Draw-On Animation via stroke-dashoffset
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    gsap.killTweensOf(path);

    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length
    });

    const tween = gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.0,
      ease: 'power2.out'
    });

    if (areaRef.current) {
      gsap.killTweensOf(areaRef.current);
      gsap.fromTo(
        areaRef.current,
        { opacity: 0 },
        { opacity: 0.15, duration: 1.0, ease: 'power2.out' }
      );
    }

    return () => {
      tween.kill();
      gsap.killTweensOf(path);
      if (areaRef.current) gsap.killTweensOf(areaRef.current);
    };
  }, [data]);

  return (
    <Card hoverLift className="flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </div>
        <Badge variant="purple">Trajectory</Badge>
      </div>

      <div className="h-56 w-full relative flex flex-col justify-end">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6D28D9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6D28D9" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path
            ref={areaRef}
            d={areaPathD}
            fill="url(#areaGradient)"
            opacity={0.15}
          />

          {/* Line Path */}
          <path
            ref={pathRef}
            d={linePathD}
            fill="none"
            stroke="#6D28D9"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="4"
              className="fill-white dark:fill-slate-900 stroke-[#6D28D9] stroke-[2.5]"
            />
          ))}
        </svg>

        {/* X Axis Labels */}
        <div className="flex justify-between px-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">
          {data.map((d, i) => (
            <span key={i}>{d.period}</span>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TenantGrowthChart;
