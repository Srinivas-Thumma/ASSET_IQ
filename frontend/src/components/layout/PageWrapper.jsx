import React from 'react';
import PageTransition from './PageTransition.jsx';

/**
 * PageWrapper — wraps PageTransition with support for either `pageKey` or `pageId`.
 */
export const PageWrapper = ({
  children,
  pageKey,
  pageId,
  className = '',
  style = {}
}) => {
  return (
    <PageTransition
      pageKey={pageKey !== undefined ? pageKey : pageId}
      className={className}
      style={style}
    >
      {children}
    </PageTransition>
  );
};

export default PageWrapper;
