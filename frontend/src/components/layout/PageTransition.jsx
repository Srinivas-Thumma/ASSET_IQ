import React from 'react';

/**
 * PageTransition Component
 *
 * Provides a clean, standard fade-in animation (opacity: 0 -> opacity: 1)
 * when content mounts or when the `pageKey` changes.
 *
 * Uses native CSS keyframe animation (`pageFadeIn` with `animation-fill-mode: both`)
 * to guarantee that content starts at opacity: 0 before the first browser paint,
 * completely eliminating any initial text flash, flicker, or layout shift.
 */
export const PageTransition = ({
  children,
  pageKey,
  className = '',
  style = {}
}) => {
  return (
    <div
      key={pageKey}
      style={{ width: '100%', ...style }}
      className={`page-fade-in min-w-0 ${className}`}
    >
      {children}
    </div>
  );
};

export default PageTransition;
