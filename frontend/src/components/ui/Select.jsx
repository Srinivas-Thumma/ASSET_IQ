import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export const Select = ({
  label,
  name,
  value,
  defaultValue,
  onChange,
  options = [],
  register,
  error,
  placeholder = 'Select an option...',
  required = false,
  className = '',
  disabled = false,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, placeUpward: false });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Extract options if passed as children (<option value="x">Label</option>) or as options array
  const parsedOptions = React.useMemo(() => {
    if (options && options.length > 0) {
      return options;
    }
    if (children) {
      const opts = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props) {
          opts.push({
            value: child.props.value !== undefined ? child.props.value : '',
            label: child.props.children || child.props.label || String(child.props.value)
          });
        }
      });
      return opts;
    }
    return [];
  }, [options, children]);

  // Handle controlled / uncontrolled value
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : defaultValue || '');

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const approxHeight = Math.min(240, (parsedOptions.length + 1) * 36 + 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeUpward = spaceBelow < approxHeight && rect.top > approxHeight;

    const top = placeUpward ? rect.top - approxHeight - 4 : rect.bottom + 4;
    const left = rect.left;
    const width = rect.width;

    setPosition({ top, left, width, placeUpward });
  }, [parsedOptions.length]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close when clicking outside or scrolling/resizing
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeydown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const selectedOption = parsedOptions.find((opt) => String(opt.value) === String(internalValue));
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (val) => {
    setInternalValue(val);
    setIsOpen(false);

    if (onChange) {
      onChange({
        target: {
          name: name || '',
          value: val
        }
      });
    }
  };

  const registerProps = register ? (typeof register === 'function' ? register(name) : register) : {};

  return (
    <div className="w-full relative">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200 mb-1.5 transition-colors">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Hidden input for form integrations */}
      <input
        type="hidden"
        name={name}
        value={internalValue}
        {...registerProps}
      />

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer shadow-xs text-left
          bg-white text-slate-800 border border-purple-200/90 hover:border-purple-400
          focus:outline-none focus:ring-4 focus:ring-purple-500/15 focus:border-purple-600
          dark:bg-slate-950 dark:text-purple-100 dark:border-purple-900/60 dark:hover:border-purple-500 dark:focus:ring-purple-500/25 dark:focus:border-purple-400
          ${isOpen ? 'border-purple-500! ring-4 ring-purple-500/15! dark:border-purple-400! dark:ring-purple-500/25!' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''}
          ${error ? 'border-rose-500! dark:border-rose-500! ring-rose-500/20!' : ''}
          ${className}`}
      >
        <span className={`truncate ${!selectedOption && placeholder ? 'text-slate-400 dark:text-purple-300/50' : 'text-slate-900 dark:text-purple-50'}`}>
          {displayText}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-purple-700 dark:text-purple-300' : ''
          }`}
        />
      </button>

      {/* Portal-based Dropdown Menu Popover */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
              zIndex: 99999
            }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl p-1.5 max-h-60 overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150
              bg-white dark:bg-slate-950
              border border-purple-100 dark:border-purple-900/60
              shadow-purple-500/10 dark:shadow-purple-950/70"
          >
            {placeholder && (
              <div
                onClick={() => handleSelect('')}
                className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-purple-300/50 rounded-xl hover:bg-purple-50/60 dark:hover:bg-purple-950/40 cursor-pointer transition-colors"
              >
                {placeholder}
              </div>
            )}
            {parsedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(internalValue);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-all duration-150 my-0.5 ${
                    isSelected
                      ? 'bg-purple-100/90 dark:bg-purple-900/50 text-purple-900 dark:text-purple-100 font-bold shadow-xs'
                      : 'text-slate-700 dark:text-purple-200 hover:bg-purple-50/80 hover:text-purple-700 dark:hover:bg-purple-950/50 dark:hover:text-purple-100 font-medium'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 ml-2" />}
                </div>
              );
            })}
          </div>,
          document.body
        )}

      {error && (
        <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1">
          {typeof error === 'string' ? error : error.message}
        </p>
      )}
    </div>
  );
};

export default Select;
