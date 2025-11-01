import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CoinCounter = ({
  value,
  onChange,
  size = "medium",
  showAnimation = true,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  const sizes = {
    small: { width: 16, height: 16, fontSize: 'text-sm' },
    medium: { width: 20, height: 20, fontSize: 'text-base' },
    large: { width: 24, height: 24, fontSize: 'text-lg' },
  };

  const { width, height, fontSize } = sizes[size] || sizes.medium;

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  const coinVariants = {
    idle: {
      rotateY: 0,
    },
    flip: {
      rotateY: 360,
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },
    bounce: {
      y: [0, -10, 0],
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const sparkleVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const generateSparkles = () => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.cos((i * 60 * Math.PI) / 180) * 20,
      y: Math.sin((i * 60 * Math.PI) / 180) * 20,
    }));
  };

  return (
    <motion.div
      className={`flex items-center ${fontSize} font-semibold text-yellow-600`}
      {...props}
    >
      <div className="relative">
        <motion.svg
          width={width}
          height={height}
          viewBox="0 0 20 20"
          fill="currentColor"
          className="text-yellow-500"
          animate={showAnimation && isAnimating ? "flip" : "idle"}
          variants={coinVariants}
        >
          <circle cx="10" cy="10" r="9" />
          <circle cx="10" cy="10" r="7" fill="#fbbf24" />
          <text x="10" y="14" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="bold">
            $
          </text>
        </motion.svg>

        <AnimatePresence>
          {showAnimation && isAnimating && (
            <>
              {generateSparkles().map((sparkle) => (
                <motion.div
                  key={sparkle.id}
                  className="absolute top-1/2 left-1/2 w-1 h-1 bg-yellow-400 rounded-full"
                  style={{
                    x: sparkle.x,
                    y: sparkle.y,
                  }}
                  variants={sparkleVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      <motion.span
        className="ml-2"
        animate={showAnimation && isAnimating ? "bounce" : "idle"}
        variants={coinVariants}
      >
        {displayValue}
      </motion.span>
    </motion.div>
  );
};

export default CoinCounter;