import React, { useState, useRef, useEffect } from 'react';

export const Dropdown = ({
  trigger,
  children,
  align = 'right', // 'left' | 'right'
  className = '',
  menuClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const alignmentClass =
    align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {typeof trigger === 'function' ? trigger({ isOpen }) : trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${alignmentClass} mt-2 w-56 rounded-2xl p-1.5 z-50 transition-all duration-200 animate-in fade-in zoom-in-95
            bg-white/95 dark:bg-slate-950/95 backdrop-blur-md
            border border-purple-100 dark:border-purple-900/50
            shadow-xl shadow-purple-500/10 dark:shadow-2xl dark:shadow-purple-950/60
            ${menuClassName}`}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({
  icon: Icon,
  children,
  onClick,
  variant = 'default', // 'default' | 'danger' | 'purple'
  className = '',
  disabled = false
}) => {
  const baseClasses =
    'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left';

  const variants = {
    default:
      'text-slate-700 dark:text-purple-200 hover:bg-purple-50/80 hover:text-purple-700 dark:hover:bg-purple-950/50 dark:hover:text-purple-100',
    purple:
      'text-purple-700 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50',
    danger:
      'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant] || variants.default} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 opacity-80" />}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
};

export const DropdownHeader = ({ children, className = '' }) => (
  <div
    className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 border-b border-purple-100/80 dark:border-purple-900/40 mb-1 ${className}`}
  >
    {children}
  </div>
);

export const DropdownDivider = () => (
  <div className="h-px bg-purple-100/80 dark:bg-purple-900/40 my-1" />
);

export default Dropdown;
