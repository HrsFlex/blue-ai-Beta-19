import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PageTransition = ({ children, location }) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      scale: 0.98,
      y: 20,
    },
    in: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      scale: 1.02,
      y: -20,
    },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// For use with React Router
export const AnimatedRoutes = ({ children, location }) => {
  return <PageTransition location={location}>{children}</PageTransition>;
};

// For individual page transitions
export const FadeIn = ({ children, delay = 0, duration = 0.5 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// For slide-in animations
export const SlideIn = ({
  children,
  direction = 'left',
  delay = 0,
  duration = 0.5
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: -100, opacity: 0 };
      case 'right':
        return { x: 100, opacity: 0 };
      case 'up':
        return { y: 100, opacity: 0 };
      case 'down':
        return { y: -100, opacity: 0 };
      default:
        return { x: -100, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;