import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SuccessAnimation = ({ show, children, duration = 2000 }) => {
  const successVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  const checkmarkVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: 0.2,
        ease: "easeOut",
      },
    },
  };

  const circleVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          variants={successVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="relative">
            <motion.svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              className="absolute top-0 left-0"
              variants={circleVariants}
            >
              <circle
                cx="40"
                cy="40"
                r="38"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
              />
            </motion.svg>
            <motion.svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              variants={checkmarkVariants}
            >
              <motion.path
                d="M20 40 L35 55 L60 25"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
            {children && (
              <motion.div
                className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {children}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAnimation;