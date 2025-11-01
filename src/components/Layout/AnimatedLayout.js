import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatedRoutes } from '../Animations';

const AnimatedLayout = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatedRoutes location={location.key}>
      {children}
    </AnimatedRoutes>
  );
};

export default AnimatedLayout;