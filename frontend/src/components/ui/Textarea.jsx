import React, { forwardRef } from 'react';

export const Textarea = forwardRef(
  (
    {
      label,
      name,
      rows = 3,
      placeholder,
      register,
      error,
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
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          name={name}
          rows={rows}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y bg-white ${
            error
              ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500'
              : 'border-slate-300'
          } ${className}`}
          {...registerProps}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-600 mt-1">
            {typeof error === 'string' ? error : error.message}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
