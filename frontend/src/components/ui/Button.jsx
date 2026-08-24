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
    'inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:border-purple-600 dark:focus-visible:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary:
      'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 shadow-xs border border-transparent',
    secondary:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-transparent',
    outline:
      'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-2xs',
    ghost:
      'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white border border-transparent',
    destructive:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs border border-transparent',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs border border-transparent'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-5 text-sm gap-2',
    lg: 'h-11 px-7 text-base gap-2.5',
    icon: 'h-10 w-10 p-0 gap-0'
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || isBusy}
      onClick={onClick}
      whileTap={disabled || isBusy ? {} : { scale: 0.97 }}
      transition={{ duration: 0.12 }}
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
