import React from 'react';

export const Avatar = ({ name = 'User', src, size = 'md', className = '' }) => {
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover shrink-0 ${sizes[size] || sizes.md} ${className}`}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center font-semibold rounded-full bg-indigo-100 text-indigo-700 select-none shrink-0 ${sizes[size] || sizes.md} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
