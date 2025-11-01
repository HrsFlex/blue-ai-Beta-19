import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const AnimatedCard = ({
  children,
  className = '',
  delay = 0,
  hoverEffect = true,
  tapEffect = true,
  ...props
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    hover: hoverEffect ? {
      y: -5,
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    } : {},
    tap: tapEffect ? {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    } : {},
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;