import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * PageWrapper — route-change slide transitions.
 *
 * Only animates Y position on entrance (no opacity).
 * Opacity is reserved for exit only, so inner page stagger containers
 * can own the fade-in via style={{ opacity: 0 }} + animate={{ opacity: 1 }}.
 */

const pageTransitionVariants = {
  initial: {
    y: 8
  },
  animate: {
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 1, 0.5, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1]
    }
  }
};

export const PageWrapper = ({
  children,
  pageId,
  className = '',
  style = {}
}) => {
  const location = useLocation();
  const animationKey = pageId !== undefined ? pageId : location.pathname;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey}
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%', ...style }}
        className={`min-w-0 ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageWrapper;
