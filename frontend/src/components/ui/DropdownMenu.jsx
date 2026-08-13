import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export const DropdownMenu = ({
  trigger,
  items = [],
  children,
  align = 'right',
  className = '',
  menuWidth = 180
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, placeUpward: false });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const approxHeight = items.length > 0 ? items.length * 38 + 16 : 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeUpward = spaceBelow < approxHeight && rect.top > approxHeight;

    let top = placeUpward ? rect.top - approxHeight - 4 : rect.bottom + 6;
    let left = align === 'right' ? rect.right - menuWidth : rect.left;

    // Boundary guards
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    setPosition({ top, left, placeUpward });
  };

  const handleToggle = (e) => {
    e?.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleOutsideClick = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
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

    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className="inline-flex items-center"
      >
        {trigger ? (
          typeof trigger === 'function' ? (
            trigger({ isOpen, toggle: handleToggle })
          ) : (
            trigger
          )
        ) : (
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${menuWidth}px`,
              zIndex: 9999
            }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 text-left space-y-0.5 animate-in fade-in zoom-in-95 duration-100 ${className}`}
          >
            {items && items.length > 0 ? (
              items.map((item, idx) => {
                const Icon = item.icon;
                const isDanger = item.variant === 'danger';
                return (
                  <React.Fragment key={idx}>
                    {item.divider && (
                      <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        item.onClick?.();
                      }}
                      className={`w-full px-3.5 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors text-left ${
                        isDanger
                          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-300'
                      }`}
                    >
                      {Icon && (
                        <Icon
                          className={`w-3.5 h-3.5 ${
                            isDanger ? 'text-rose-600' : 'text-purple-600'
                          }`}
                        />
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                  </React.Fragment>
                );
              })
            ) : (
              typeof children === 'function' ? children({ close: () => setIsOpen(false) }) : children
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default DropdownMenu;
