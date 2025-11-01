import React, { useState, useEffect } from 'react';

// Hook for detecting reduced motion preference
export const useReducedMotion = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return shouldReduceMotion;
};

// Hook for staggered animations
export const useStaggeredAnimation = (items, delay = 0.1) => {
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * delay * 1000);
    });

    return () => setVisibleItems([]);
  }, [items, delay]);

  return visibleItems;
};

// Hook for counting animation
export const useCountUp = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (start === end) return;

    setIsAnimating(true);
    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(start + (end - start) * easeOutQuart);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(updateCount);
  }, [end, duration, start]);

  return { count, isAnimating };
};

// Hook for triggering animations on scroll
export const useScrollAnimation = (threshold = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = React.useRef();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsIntersecting(true);
          setHasAnimated(true);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, hasAnimated]);

  return { elementRef, isIntersecting, hasAnimated };
};

// Hook for coin animation
export const useCoinAnimation = (initialCoins = 0) => {
  const [coins, setCoins] = useState(initialCoins);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState(null);

  const addCoins = (amount, type = 'bounce') => {
    setCoins(prev => prev + amount);
    setAnimationType(type);
    setIsAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
      setAnimationType(null);
    }, 1000);
  };

  const spendCoins = (amount) => {
    if (coins >= amount) {
      setCoins(prev => prev - amount);
      setAnimationType('flip');
      setIsAnimating(true);

      setTimeout(() => {
        setIsAnimating(false);
        setAnimationType(null);
      }, 600);
    }
  };

  return { coins, isAnimating, animationType, addCoins, spendCoins };
};

// Hook for success animation
export const useSuccessAnimation = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const triggerSuccess = (successMessage) => {
    setMessage(successMessage);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setMessage('');
    }, 2000);
  };

  return { showSuccess, message, triggerSuccess };
};