import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

export const Input = forwardRef(
  (
    {
      label,
      name,
      type = 'text',
      placeholder,
      register,
      error,
      icon: Icon,
      required = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const registerProps = register ? (typeof register === 'function' ? register(name) : register) : {};

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 transition-colors">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            name={name}
            type={type}
            placeholder={placeholder}
            className={cn(
              'w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-600 dark:focus:border-purple-400 transition-colors shadow-2xs',
              Icon && 'pl-9.5',
              error && 'border-rose-500! focus:ring-rose-500/30! focus:border-rose-500!',
              className
            )}
            {...registerProps}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
            {typeof error === 'string' ? error : error.message}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
