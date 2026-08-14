import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { cn } from '../../utils/cn.js';

export const Card = ({
  children,
  title,
  subtitle,
  icon: Icon,
  action,
  className = '',
  bodyClassName = '',
  hover = false,
  hoverLift = false,
  alert = false,
  onClick,
  ...props
}) => {
  const cardRef = useRef(null);
  const shouldLift = hover || hoverLift;

  // GSAP At-Risk / Alert Pulsing Animation
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !alert) return;

    const tween = gsap.to(el, {
      boxShadow: '0 0 0 3px rgba(234, 179, 8, 0.35)',
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    return () => {
      tween.kill();
      gsap.killTweensOf(el);
      if (el) el.style.boxShadow = '';
    };
  }, [alert]);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 transition-all duration-200',
        alert && 'border-amber-400/60 dark:border-amber-500/50',
        shouldLift && 'hover:shadow-md hover:-translate-y-0.5 hover:border-purple-200 dark:hover:border-purple-900 cursor-pointer',
        className
      )}
      {...props}
    >
      {(title || subtitle || action || Icon) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-100 dark:border-purple-900/40 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }) => (
  <h3 className={cn('text-base font-semibold text-slate-900 dark:text-white tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className = '', children, ...props }) => (
  <p className={cn('text-sm text-slate-500 dark:text-slate-400', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }) => (
  <div className={cn('pt-0', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }) => (
  <div className={cn('flex items-center pt-4 border-t border-slate-100 dark:border-slate-800', className)} {...props}>
    {children}
  </div>
);

export default Card;
