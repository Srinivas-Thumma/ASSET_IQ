import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const isBusy = loading || isLoading;

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary:
      'bg-[#6D28D9] text-white hover:bg-purple-700 active:bg-purple-800 shadow-sm border border-transparent',
    secondary:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent',
    outline:
      'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs',
    ghost:
      'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-transparent',
    destructive:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-6 text-sm gap-2',
    lg: 'h-12 px-8 text-base gap-2.5',
    icon: 'h-10 w-10 p-0 gap-0'
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || isBusy}
      onClick={onClick}
      whileHover={disabled || isBusy ? {} : { scale: 1.015 }}
      whileTap={disabled || isBusy ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(
        baseStyles,
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {isBusy ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : null}
      {children && <span>{children}</span>}
    </motion.button>
  );
};

export default Button;
