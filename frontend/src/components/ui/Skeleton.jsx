import React from 'react';

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
      case 'avatar':
        return 'rounded-full';
      case 'card':
        return 'rounded-[12px] h-36 w-full';
      case 'table-row':
        return 'h-14 w-full rounded-lg';
      case 'badge':
        return 'h-6 w-20 rounded-full';
      case 'rectangular':
        return 'rounded-xl';
      case 'text':
      default:
        return 'h-4 w-full rounded-md';
    }
  };

  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      style={{ width, height }}
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800 ${getVariantStyles()} ${className}`}
    />
  ));

  return count === 1 ? elements[0] : <div className="space-y-2.5 w-full">{elements}</div>;
};

export default Skeleton;
