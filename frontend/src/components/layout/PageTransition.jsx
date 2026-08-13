import React from 'react';
import PageWrapper from './PageWrapper.jsx';

export const PageTransition = ({ children, pageId }) => {
  return <PageWrapper pageId={pageId}>{children}</PageWrapper>;
};

export default PageTransition;
