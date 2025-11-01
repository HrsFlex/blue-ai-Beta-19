import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AnimatedProgress = ({
  value,
  maxValue = 100,
  height = "8px",
  backgroundColor = "#e5e7eb",
  fillColor = "#10b981",
  showPercentage = false,
  animated = true,
  delay = 0,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min(100, (value / maxValue) * 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated, delay]);

  const progressVariants = {
    hidden: {
      width: "0%",
    },
    visible: {
      width: `${percentage}%`,
      transition: {
        duration: 1,
        delay: delay,
        ease: "easeOut",
      },
    },
  };

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: delay,
      },
    },
  };

  const milestoneVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        delay: delay + 0.5,
        ease: "easeOut",
      },
    },
  };

  const isMilestone = percentage >= 100;

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {showPercentage && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress
          </span>
          <motion.span
            className="text-sm font-medium text-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
          >
            {Math.round((displayValue / maxValue) * 100)}%
          </motion.span>
        </div>
      )}

      <div className="relative">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height, backgroundColor }}
        >
          <motion.div
            className="h-full rounded-full relative"
            variants={animated ? progressVariants : {}}
            initial="hidden"
            animate="visible"
            style={{ backgroundColor: fillColor }}
          >
            {isMilestone && (
              <motion.div
                className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2"
                variants={milestoneVariants}
              >
                <div className="bg-yellow-400 text-yellow-900 rounded-full p-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L9.856 6.144L16 8L9.856 9.856L8 16L6.144 9.856L0 8L6.144 6.144L8 0Z"/>
                  </svg>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {isMilestone && (
          <motion.div
            className="absolute -top-8 right-0 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.7, duration: 0.3 }}
          >
            Milestone Reached! 🎉
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AnimatedProgress;