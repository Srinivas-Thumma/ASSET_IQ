import React from 'react';

/**
 * PageTransition Component
 *
 * Provides a clean CSS fade-in animation for page content without forcing
 * destructive React fiber tree unmounts that break in-flight queries.
 */
export const PageTransition = ({
  children,
  className = '',
  style = {}
}) => {
  return (
    <div
      style={{ width: '100%', ...style }}
      className={`page-fade-in min-w-0 ${className}`}
    >
      {children}
    </div>
  );
};

export default PageTransition;
